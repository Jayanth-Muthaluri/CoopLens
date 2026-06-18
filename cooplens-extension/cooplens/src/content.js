// CoopLens content script v2
// Robust multi-platform job description scraper

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_JD') {
    const result = scrapeJobDescription();
    sendResponse(result);
  }
  return true;
});

function scrapeJobDescription() {
  const hostname = window.location.hostname;
  const url = window.location.href;

  const platformMap = [
    { match: 'linkedin.com',         fn: scrapeLinkedIn },
    { match: 'greenhouse.io',        fn: scrapeGreenhouse },
    { match: 'boards.greenhouse.io', fn: scrapeGreenhouse },
    { match: 'lever.co',             fn: scrapeLever },
    { match: 'jobs.lever.co',        fn: scrapeLever },
    { match: 'myworkdayjobs.com',    fn: scrapeWorkday },
    { match: 'wd1.myworkdayjobs',    fn: scrapeWorkday },
    { match: 'wd3.myworkdayjobs',    fn: scrapeWorkday },
    { match: 'joinhandshake.com',    fn: scrapeHandshake },
    { match: 'app.joinhandshake',    fn: scrapeHandshake },
    { match: 'indeed.com',           fn: scrapeIndeed },
    { match: 'smartrecruiters.com',  fn: scrapeSmartRecruiters },
    { match: 'ashbyhq.com',          fn: scrapeAshby },
    { match: 'rippling.com',         fn: scrapeGeneric },
    { match: 'icims.com',            fn: scrapeGeneric },
    { match: 'taleo.net',            fn: scrapeGeneric },
  ];

  for (const { match, fn } of platformMap) {
    if (hostname.includes(match)) return fn();
  }
  return scrapeGeneric();
}

// ── Platform scrapers ──────────────────────────────────

function scrapeLinkedIn() {
  // LinkedIn jobs/view/ID page
  const title = firstText([
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1[class*="topcard__title"]',
    'h1[class*="job-title"]',
    '.job-details-jobs-unified-top-card__job-title',
  ]);
  const company = firstText([
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name',
    'a[class*="topcard__org"]',
    '.topcard__org-name-link',
  ]);
  const location = firstText([
    '.job-details-jobs-unified-top-card__bullet',
    '.job-details-jobs-unified-top-card__workplace-type',
    'span[class*="topcard__flavor"]',
  ]);
  const description = firstText([
    '.jobs-description__content',
    '.jobs-description-content__text',
    '#job-details',
    '.jobs-box__html-content',
    '[class*="job-description"]',
  ]);

  return buildResult({ title, company, location, description, platform: 'LinkedIn' });
}

function scrapeGreenhouse() {
  const title = firstText([
    'h1.app-title',
    'h1[class*="job-title"]',
    '.posting-headline h2',
    'h1',
  ]);
  const company = firstText([
    '.company-name',
    '[class*="company-name"]',
    'title', // fallback: page title often has company
  ]);
  const location = firstText([
    '.location',
    '[class*="location"]',
    '.office',
  ]);
  const description = firstText([
    '#content',
    '.job-post-content',
    '.section-wrapper',
    '[class*="job-description"]',
    'main',
  ]);

  return buildResult({ title, company, location, description, platform: 'Greenhouse' });
}

function scrapeLever() {
  const title = firstText([
    '.posting-headline h2',
    'h2[data-qa="posting-name"]',
    'h2',
  ]);
  const company = document.querySelector('.main-header-logo img')?.alt?.trim()
    || firstText(['.company-name', '[class*="company"]']);
  const location = firstText([
    '.sort-by-time',
    '.location',
    '[class*="location"]',
  ]);
  const description = firstText([
    '[data-qa="job-description"]',
    '.content',
    '.posting-requirements',
    '.section-wrapper',
  ]);

  return buildResult({ title, company, location, description, platform: 'Lever' });
}

function scrapeWorkday() {
  const title = firstText([
    '[data-automation-id="jobPostingHeader"]',
    'h2[data-automation-id]',
    '.css-1f5dfwz',
    'h1',
  ]);
  const company = firstText([
    '[data-automation-id="organizationName"]',
    '.css-l4otbe',
  ]);
  const location = firstText([
    '[data-automation-id="location"]',
    '[data-automation-id="office"]',
  ]);
  const description = firstText([
    '[data-automation-id="jobPostingDescription"]',
    '[data-automation-id="job-posting-details"]',
    '.css-1m6jk12',
  ]);

  return buildResult({ title, company, location, description, platform: 'Workday' });
}

function scrapeHandshake() {
  const title = firstText([
    '[class*="job-title"]',
    'h1[class*="title"]',
    'h1',
  ]);
  const company = firstText([
    '[class*="employer-name"]',
    '[class*="company-name"]',
    '[class*="employer"]',
  ]);
  const location = firstText([
    '[class*="location"]',
    '[class*="city"]',
  ]);
  const description = firstText([
    '[class*="job-description"]',
    '[class*="description-body"]',
    '[class*="description"]',
  ]);

  return buildResult({ title, company, location, description, platform: 'Handshake' });
}

function scrapeIndeed() {
  const title = firstText([
    'h1[class*="jobsearch-JobInfoHeader-title"]',
    'h1.jobTitle',
    'h1',
  ]);
  const company = firstText([
    '[data-testid="inlineHeader-companyName"] a',
    '[data-testid="inlineHeader-companyName"]',
    '[class*="companyName"]',
  ]);
  const location = firstText([
    '[data-testid="inlineHeader-companyLocation"]',
    '[class*="companyLocation"]',
  ]);
  const description = firstText([
    '#jobDescriptionText',
    '[class*="jobsearch-jobDescriptionText"]',
  ]);

  return buildResult({ title, company, location, description, platform: 'Indeed' });
}

function scrapeSmartRecruiters() {
  const title = firstText(['h1[class*="job-title"]', 'h1.details-title', 'h1']);
  const company = firstText(['.company-name', '[class*="company"]']);
  const location = firstText(['.details-location', '[class*="location"]']);
  const description = firstText(['#st-jobDescription', '.details-content', 'main']);
  return buildResult({ title, company, location, description, platform: 'SmartRecruiters' });
}

function scrapeAshby() {
  const title = firstText(['h1', '[class*="job-title"]']);
  const company = firstText(['.company-name', 'header [class*="name"]']);
  const location = firstText(['[class*="location"]', '[class*="office"]']);
  const description = firstText(['[class*="job-description"]', 'main section', 'main']);
  return buildResult({ title, company, location, description, platform: 'Ashby' });
}

function scrapeGeneric() {
  // Smart fallback: score candidate elements by JD signal words
  const JD_SIGNALS = [
    'responsibilit', 'qualif', 'requirement', 'about the role',
    'what you\'ll do', 'what we\'re looking', 'who you are',
    'nice to have', 'preferred', 'benefits', 'compensation',
  ];

  const title =
    firstText(['h1[class*="job"], h1[class*="title"], h1[class*="position"]']) ||
    document.querySelector('h1')?.innerText?.trim();

  const company = firstText([
    '[class*="company"], [class*="employer"], [class*="organization"]',
    '[itemprop="hiringOrganization"]',
  ]);

  const location = firstText([
    '[class*="location"], [itemprop="jobLocation"]',
    '[class*="office"]',
  ]);

  // Score all sizeable text blocks
  const candidates = Array.from(document.querySelectorAll('div, section, article, main'))
    .filter(el => {
      const t = el.innerText || '';
      return t.length > 200 && t.length < 20000;
    })
    .map(el => {
      const text = (el.innerText || '').toLowerCase();
      const score = JD_SIGNALS.reduce((acc, sig) => acc + (text.includes(sig) ? 1 : 0), 0);
      return { el, score, len: el.innerText.length };
    })
    .filter(c => c.score >= 2)
    .sort((a, b) => b.score - a.score || b.len - a.len);

  const description = candidates[0]?.el?.innerText?.trim();

  return buildResult({ title, company, location, description, platform: 'Other' });
}

// ── Helpers ───────────────────────────────────────────

function firstText(selectors) {
  const sel = Array.isArray(selectors) ? selectors.join(', ') : selectors;
  try {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = el.innerText?.trim() || el.textContent?.trim();
      if (text && text.length > 1) return text;
    }
  } catch (e) {}
  return null;
}

function buildResult({ title, company, location, description, platform }) {
  const hasContent = !!(title || description);
  return {
    success: hasContent,
    platform,
    url: window.location.href,
    title: title?.substring(0, 200) || 'Unknown role',
    company: company?.substring(0, 100) || 'Unknown company',
    location: location?.substring(0, 100) || '',
    description: description ? description.substring(0, 6000) : '',
    scrapedAt: new Date().toISOString(),
  };
}
