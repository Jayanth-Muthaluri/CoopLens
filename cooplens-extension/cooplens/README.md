# CoopLens v2.0 — AI Job Fit Analyzer

A Chrome extension for co-op and internship seekers. Reads any job posting, scores your fit against your resume, and gives you a full analysis in ~5 seconds.

**Powered by:** Groq API (free tier) + Llama 3.3 70B

---

## Install

1. Download and unzip `cooplens-extension.zip`
2. Open `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `cooplens/` folder
5. Pin the extension via the puzzle piece 🧩 icon

## Setup

1. Get a **free Groq API key** at [console.groq.com/keys](https://console.groq.com/keys)
2. Open CoopLens → **Settings**
3. Paste your `gsk_...` key → Save
4. Paste your resume text → Save

## Usage

1. Navigate to a job posting (LinkedIn, Handshake, Greenhouse, Lever, Indeed, Workday, SmartRecruiters, Ashby)
2. Click the CoopLens icon
3. Hit **Analyze my fit**
4. Get: fit score, strengths, gaps, resume tweaks, cover letter angle, interview prep, red flags

Analyzed jobs auto-save to the **Tracker** tab with status tracking and CSV export.

## Chrome Web Store submission

Required assets are included:
- `privacy.html` — privacy policy (host this URL when submitting to the store)
- Icons: 16px, 48px, 128px PNGs
- Manifest v3 compliant

For store submission, you'll also need:
- A 1280×800 or 640×400 screenshot of the popup
- A 440×280 store tile (optional but recommended)

## File structure

```
cooplens/
├── manifest.json        MV3 config
├── popup.html           Extension UI
├── privacy.html         Privacy policy (required for store)
├── icons/               16, 48, 128px PNGs
└── src/
    ├── popup.js         UI logic
    ├── content.js       DOM scraper (10+ platforms)
    └── background.js    Groq API + storage
```

## Supported platforms

LinkedIn · Handshake · Greenhouse · Lever · Indeed · Workday · SmartRecruiters · Ashby · Generic fallback

## Cost

Groq free tier: 14,400 requests/day, 30 requests/minute. Each analysis = 1 request. Effectively unlimited for job searching.
