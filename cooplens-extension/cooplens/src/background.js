// CoopLens background service worker
// Handles API calls and storage operations

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_JD') {
    analyzeJobDescription(message.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'SAVE_APPLICATION') {
    saveApplication(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_APPLICATIONS') {
    getApplications()
      .then(apps => sendResponse({ success: true, data: apps }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'DELETE_APPLICATION') {
    deleteApplication(message.id)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function analyzeJobDescription({ jd, profile, apiKey }) {
  const systemPrompt = `You are a senior recruiter and career coach specializing in helping international students land co-op and internship roles in product management, project management, operations, and strategy.

You will receive a job description and a candidate profile. Produce a brutally honest, specific fit analysis.

Respond ONLY with valid JSON — no markdown fences, no preamble, no explanation. Just the raw JSON object:
{
  "fitScore": <integer 0-100>,
  "fitLabel": "<one of: Strong Match / Decent Fit / Stretch Role / Not a Fit>",
  "fitSummary": "<2-3 sentence honest summary of overall fit>",
  "matchedStrengths": [
    { "skill": "<skill or experience>", "evidence": "<what in their profile supports this>" }
  ],
  "gaps": [
    { "gap": "<missing skill or experience>", "severity": "<Critical / Moderate / Minor>", "fix": "<specific actionable fix>" }
  ],
  "resumeTweaks": [
    "<specific bullet or section change to tailor resume for this role>"
  ],
  "coverLetterAngle": "<the single most compelling angle to lead the cover letter with>",
  "interviewPrepTopics": [
    "<likely interview topic or question to prepare for>"
  ],
  "redFlags": [
    "<anything that could get this application auto-rejected>"
  ],
  "applyRecommendation": "<Apply Now / Apply With Tweaks / Stretch — Apply Anyway / Skip>"
}`;

  const userMessage = `JOB DESCRIPTION:
${jd.title} at ${jd.company}
${jd.location ? `Location: ${jd.location}` : ''}
URL: ${jd.url}

${jd.description}

---

CANDIDATE PROFILE:
${profile}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  // Strip markdown fences if the model wraps in ```json
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function saveApplication(app) {
  const { applications = [] } = await chrome.storage.local.get('applications');
  const existing = applications.findIndex(a => a.url === app.url);
  if (existing >= 0) {
    applications[existing] = app;
  } else {
    applications.unshift(app);
  }
  if (applications.length > 100) applications.pop();
  await chrome.storage.local.set({ applications });
}

async function getApplications() {
  const { applications = [] } = await chrome.storage.local.get('applications');
  return applications;
}

async function deleteApplication(id) {
  const { applications = [] } = await chrome.storage.local.get('applications');
  const filtered = applications.filter(a => a.id !== id);
  await chrome.storage.local.set({ applications: filtered });
}
