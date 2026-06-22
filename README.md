# CoopLens - AI Job Fit Analyzer

> A Chrome extension that reads any job posting, scores your fit against your resume, and gives you a full analysis in ~5 seconds. Built for co-op and internship seekers who are tired of applying blind.

![Version](https://img.shields.io/badge/version-2.0.0-7c6fef?style=flat-square)
![Manifest](https://img.shields.io/badge/manifest-v3-34d399?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-f87171?style=flat-square)
![Free](https://img.shields.io/badge/AI-Groq%20%28free%29-fbbf24?style=flat-square)

---

## What it does

You're on a LinkedIn job page. You click CoopLens. In 5 seconds you get:

- **Fit score** (0-100) with a plain-English verdict
- **Matched strengths** - what in your resume directly supports this role
- **Gaps** - ranked Critical / Moderate / Minor, each with a specific fix
- **Resume tweaks** - exact bullet changes to tailor your resume for this role
- **Cover letter angle** - the single most compelling hook to lead with
- **Interview prep topics** - what they're likely to ask
- **Red flags** - anything that could get you auto-rejected
- **Apply recommendation** - Apply Now / Apply With Tweaks / Stretch / Skip

Everything auto-saves to a built-in **Tracker** with status tracking and CSV export.

---

## Demo

| Analyze tab | Results | Tracker |
|---|---|---|
| Detects job from page | Fit score + full breakdown | Pipeline with status |

*(Screenshots coming soon)*

---

## Install

### Option A - Load unpacked (developer mode)

1. Download this repo as a ZIP → unzip it
2. Open `chrome://extensions/`
3. Toggle **Developer mode** ON (top right)
4. Click **Load unpacked** → select the `cooplens/` folder
5. Pin CoopLens via the 🧩 puzzle piece icon in your toolbar

### Option B - Chrome Web Store

1. Install from Chrome Web Store [https://chromewebstore.google.com/detail/lnbkldcfedcikhdpidmpckkhbangplpj?utm_source=item-share-cb](https://chromewebstore.google.com/detail/lnbkldcfedcikhdpidmpckkhbangplpj?utm_source=item-share-cb)

---

## Setup (2 minutes)

**1. Get a free Groq API key**

- Go to [console.groq.com/keys](https://console.groq.com/keys)
- Sign up (free, no credit card required)
- Click **Create API key** → copy it (starts with `gsk_...`)

**2. Configure CoopLens**

- Click the CoopLens icon → go to **Settings**
- Paste your `gsk_...` key → **Save key**
- Paste your resume text into the profile box → **Save profile**

The more detail you include in your profile (skills, projects, experience, certifications), the more accurate your fit scores will be.

---

## Usage

1. Navigate to any job posting on a supported platform
2. Click the **CoopLens** icon in your toolbar
3. Hit **Analyze my fit**
4. Read your analysis - act on it before applying

---

## Supported platforms

| Platform | Status |
|---|---|
| LinkedIn Jobs | ✅ Full support |
| Handshake | ✅ Full support |
| Greenhouse | ✅ Full support |
| Lever | ✅ Full support |
| Indeed | ✅ Full support |
| Workday | ✅ Full support |
| SmartRecruiters | ✅ Full support |
| Ashby | ✅ Full support |
| Everything else | ✅ Generic fallback |

---

## Tech stack

| Layer | Technology |
|---|---|
| Extension | Chrome Manifest V3 |
| AI model | Llama 3.3 70B via [Groq](https://groq.com) |
| Storage | Chrome local storage (on-device only) |
| Scraping | Custom DOM selectors per platform + smart generic fallback |
| UI | Vanilla JS + CSS (zero dependencies) |

---

## Cost

Groq free tier gives you **14,400 requests/day** and **30 requests/minute**.  
Each analysis = 1 request. Effectively unlimited for job searching.  
No credit card required.

---

## Project structure

```
cooplens/
├── manifest.json          Chrome MV3 config
├── popup.html             Extension UI (dark theme)
├── privacy.html           Privacy policy
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── popup.js           UI logic, state management, rendering
    ├── content.js         DOM scraper - 8 platform-specific + generic fallback
    └── background.js      Groq API calls + Chrome storage operations
```

---

## Privacy

- Your API key and resume are stored **locally in Chrome only** - never sent anywhere except Groq's API when you click Analyze
- Job descriptions are sent to [Groq's API](https://groq.com/privacy-policy) for analysis
- CoopLens operates no backend, no database, no analytics
- All data can be deleted via **Settings → Clear all data** or by removing the extension

---

## Roadmap

- [ ] Cover letter first-paragraph generator
- [ ] Application notes per job
- [ ] Weekly pipeline summary (apply rate, avg fit score)
- [ ] Chrome Web Store listing
- [ ] Firefox support

---

## Contributing

Pull requests welcome. If you find a job board whose scraping is broken, open an issue with the URL and I'll add a dedicated scraper.

---

## Built by

**Jayanth** — MS Information Systems, Northeastern University  
Built as a real tool to navigate my own co-op search. Scratched my own itch.

[LinkedIn](https://www.linkedin.com/in/jayanthm20/) · [Portfolio](https://jayanth-muthaluri-portfolio.netlify.app/)

---

## License

MIT — use it, fork it, ship it.
