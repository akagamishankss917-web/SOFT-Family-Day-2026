# SOFT Family Day 2026 — Committee Registration Tool

**Date:** 2026-06-08
**Status:** Approved (design)

## Purpose

A web page committee members open on their phones to register event attendees.
Each registration saves to an online Google Sheet that committee admins can view,
sort, filter, and export. The page is gated by a shared passcode so only committee
members use it. A live header shows running totals per group.

## Users

- **Committee members** — open the page, unlock with the shared passcode, register
  people who reach out to them.
- **Committee admin** — owns the Google Sheet and Apps Script; views/manages data.

## Data collected (per registration row)

| Column      | Source        | Required |
|-------------|---------------|----------|
| Timestamp   | server (auto) | yes      |
| Full Name   | form input    | yes      |
| Group       | form choice   | yes      |
| Phone       | form input    | no       |

**Group categories:** `Children`, `Young People`, `Pastor & Elders`.

## Architecture

```
Committee phone
   │
   ▼
register.html ──(POST submit)──► Google Apps Script Web App ──► Google Sheet ("Registrations")
(in project root,                (free, owned by admin)         Timestamp | Full Name | Group | Phone
 deploys with site)
   ▲                                      │
   └─────(GET counts on load/submit)──────┘
```

- **Frontend:** single self-contained `register.html` in the project root, deploys
  alongside `index.html`. Reachable at `/register.html`.
- **Backend:** Google Apps Script bound to the Sheet, published as a Web App.
  - `POST` → append a row `[timestamp, fullName, group, phone]`.
  - `GET`  → return current counts as JSON.
- **Database:** Google Sheet, columns `Timestamp | Full Name | Group | Phone`.

### CORS / transport note

Apps Script Web Apps do not return custom CORS headers. To avoid a preflight, the
frontend POSTs as `Content-Type: text/plain` (body is a JSON string the script
parses). The GET for counts returns JSON via `ContentService`. This is the standard
pattern for talking to Apps Script from a static page.

## Brand

Match existing `index.html` — "Heavenly Light" palette and fonts:
- Palette vars: sky blues (`#F2F8FF`/`#DFF0FB`/`#2E82B5`/`#1B6090`), gold
  (`#C49A2A`/`#E6C970`), navy (`#12293E`), ivory/pearl.
- Fonts: Cormorant Garamond (serif), Cinzel (labels), Nunito Sans (body).
- Follow CLAUDE.md anti-generic guardrails (layered shadows, custom colors,
  transform/opacity-only animation, full interactive states, grain texture).

## Page states

1. **Lock screen** — brand-styled passcode entry. Passcode: `SOFTFAMDAY26`.
   On success, unlock and remember for the session (`sessionStorage`) so the member
   is not re-prompted on every registration. Wrong code shows an inline error.
2. **Registration form**
   - **Live count header:** three cards (Children / Young People / Pastor & Elders)
     + a **Total Registered** figure. Loaded from the Sheet on page load and after
     each successful submit.
   - **Full Name** — required text input.
   - **Group category** — required; three large tap-friendly choice buttons.
   - **Phone number** — optional text input.
   - **Register** button → POST, success toast, clear form for next person, refresh
     counts.
3. **Error / offline handling** — failed save (e.g. no signal) shows a clear,
   non-dismissing error with retry so no registration is silently lost. Submit
   button shows a loading state and is disabled during the request to prevent
   double-submits.

## Security (explicit)

Client-side passcode is a **light gate**: it keeps casual visitors out but the PIN
is visible to anyone who inspects the page source. Acceptable for an internal,
unadvertised event tool. True security would require Google sign-in (out of scope).

## Configuration points (clearly marked in code)

- `register.html`: `const PASSCODE = "SOFTFAMDAY26";` and
  `const SCRIPT_URL = "<paste Apps Script Web App URL>";`
- Apps Script: bound to the Sheet; sheet/tab name configurable at top.

## Deliverables

1. `register.html` — finished, brand-matched, screenshot-verified page.
2. `apps-script.gs` — backend to paste into Google Apps Script (`doPost` + `doGet`).
3. `SETUP.md` — non-technical step-by-step: create Sheet, paste script, publish Web
   App, copy the URL into `register.html`, confirm passcode, test.

## Out of scope (YAGNI)

- User accounts / per-member logins.
- Editing or deleting registrations from the page (done in the Sheet directly).
- Duplicate-name detection.
- Real (server-side) authentication.

## Success criteria

- A committee member can unlock with `SOFTFAMDAY26`, register a person, and see the
  row appear in the Google Sheet.
- The header totals reflect the whole Sheet and update after each submit.
- Phone is genuinely optional (submit succeeds when blank).
- A failed network submit surfaces an error and can be retried.
- The page visually matches the existing site's brand (verified by screenshot).
