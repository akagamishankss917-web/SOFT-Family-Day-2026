# Committee Registration Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a passcode-gated, brand-matched `register.html` that saves event registrations to a Google Sheet via Apps Script and shows live per-group totals.

**Architecture:** Static self-contained HTML page (in project root, deploys with `index.html`) talks to a Google Apps Script Web App. The script appends rows to a Google Sheet on `POST` and returns counts on `GET`. Client-side passcode gate via `sessionStorage`.

**Tech Stack:** HTML/CSS/vanilla JS (no build step), Google Apps Script (`.gs`), Google Sheets. Brand: existing "Heavenly Light" palette + Cormorant Garamond / Cinzel / Nunito Sans. Verification via `serve.mjs` + `screenshot.mjs` (per CLAUDE.md).

> **NOTE:** Before writing any frontend code (Task 2 onward), invoke the `frontend-design` skill — required by CLAUDE.md every session.

---

### Task 1: Backend — Apps Script (`apps-script.gs`)

**Files:**
- Create: `apps-script.gs`

- [ ] **Step 1: Write the Apps Script**

```javascript
// ============================================================
// SOFT Family Day 2026 — Registration backend (Google Apps Script)
// Bind this to your Google Sheet, then Deploy > New deployment >
// Web app (Execute as: Me, Who has access: Anyone).
// ============================================================

const SHEET_NAME = 'Registrations';
const GROUPS = ['Children', 'Young People', 'Pastor & Elders'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Full Name', 'Group', 'Phone']);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET → return live counts per group + total
function doGet() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  const counts = { 'Children': 0, 'Young People': 0, 'Pastor & Elders': 0, total: 0 };
  if (last > 1) {
    const groups = sheet.getRange(2, 3, last - 1, 1).getValues();
    groups.forEach(function (row) {
      const g = String(row[0]).trim();
      if (counts.hasOwnProperty(g)) { counts[g]++; counts.total++; }
    });
  }
  return json_(counts);
}

// POST → append a registration row
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const name = String(data.fullName || '').trim();
    const group = String(data.group || '').trim();
    const phone = String(data.phone || '').trim();

    if (!name) return json_({ ok: false, error: 'Full name is required.' });
    if (GROUPS.indexOf(group) === -1) return json_({ ok: false, error: 'Invalid group.' });

    getSheet_().appendRow([new Date(), name, group, phone]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
```

- [ ] **Step 2: Manual verification (documented in SETUP.md, Task 4)**

Cannot unit-test Apps Script locally. Verified by the user during setup: deploy,
hit the Web App URL in a browser → should return `{"Children":0,...,"total":0}`.

- [ ] **Step 3: Commit**

```bash
git add apps-script.gs
git commit -m "feat: add Apps Script backend for registrations"
```

---

### Task 2: Frontend shell + lock screen (`register.html`)

**Files:**
- Create: `register.html`
- Reference: `index.html` (copy palette vars, font links, grain texture, easing tokens)

- [ ] **Step 1: Invoke `frontend-design` skill** (required by CLAUDE.md).

- [ ] **Step 2: Build the page skeleton + brand `<head>`**

Copy from `index.html`: the Google Fonts `<link>` (Cormorant Garamond, Cinzel,
Nunito Sans), the `:root` CSS custom properties (sky/blue/gold/navy/ivory, `--serif`,
`--label`, `--sans`, `--ease-spring`, `--ease-out`), the reset, and the `body::before`
grain overlay. Set `<title>SOFT Family Day 2026 — Registration</title>`.

- [ ] **Step 3: Build the lock screen**

A centered card: small Cinzel label, Cormorant heading "Committee Access", a passcode
`<input type="password" inputmode="text">`, an "Unlock" button (brand blue, full
interactive states: hover/focus-visible/active, transform+opacity only), and a hidden
inline error element. Layered, color-tinted shadow (no flat `shadow-md`).

Config + gate logic at top of `<script>`:

```javascript
const PASSCODE = "SOFTFAMDAY26";
const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

const lock = document.getElementById('lock');
const app  = document.getElementById('app');

function unlock() { lock.hidden = true; app.hidden = false; loadCounts(); }

if (sessionStorage.getItem('sfd_unlocked') === '1') unlock();

document.getElementById('unlockBtn').addEventListener('click', function () {
  const val = document.getElementById('passcode').value.trim();
  if (val === PASSCODE) {
    sessionStorage.setItem('sfd_unlocked', '1');
    unlock();
  } else {
    const err = document.getElementById('lockError');
    err.textContent = 'Incorrect passcode. Please try again.';
    err.hidden = false;
  }
});
```

- [ ] **Step 4: Verify lock screen visually**

Start server if not running: `node serve.mjs` (background). Then:
`node screenshot.mjs http://localhost:3000/register.html lock`
Read the PNG from `temporary screenshots/`. Confirm: brand fonts/colors render,
card centered, shadow layered. Fix mismatches, re-screenshot (≥2 rounds per CLAUDE.md).

- [ ] **Step 5: Commit**

```bash
git add register.html
git commit -m "feat: add registration page shell + passcode lock screen"
```

---

### Task 3: Registration form + live counts + submit

**Files:**
- Modify: `register.html`

- [ ] **Step 1: Build the count header**

Inside `#app`, a header with three cards (Children / Young People / Pastor & Elders)
each showing a number + label, plus a "Total Registered" figure. Give each number an
`id`: `cChildren`, `cYoung`, `cPastor`, `cTotal`. Surface layering: cards elevated
above base, gold accent on numbers.

- [ ] **Step 2: Build the form**

- Full Name: `<input id="fullName" required>`.
- Group: three large tap-friendly buttons (`data-group="Children|Young People|Pastor & Elders"`);
  clicking one sets a hidden `#group` value and adds a selected style. Required.
- Phone (optional): `<input id="phone" type="tel" inputmode="tel">`.
- Register button `#submitBtn` with loading state; a `#formMsg` element for success/error.

- [ ] **Step 3: Wire counts (GET)**

```javascript
async function loadCounts() {
  try {
    const res = await fetch(SCRIPT_URL);
    const c = await res.json();
    document.getElementById('cChildren').textContent = c['Children'] ?? 0;
    document.getElementById('cYoung').textContent    = c['Young People'] ?? 0;
    document.getElementById('cPastor').textContent   = c['Pastor & Elders'] ?? 0;
    document.getElementById('cTotal').textContent    = c.total ?? 0;
  } catch (e) { /* leave existing numbers; counts are non-critical */ }
}
```

- [ ] **Step 4: Wire submit (POST)**

```javascript
const submitBtn = document.getElementById('submitBtn');
const formMsg = document.getElementById('formMsg');

document.getElementById('regForm').addEventListener('submit', async function (ev) {
  ev.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const group = document.getElementById('group').value;
  const phone = document.getElementById('phone').value.trim();

  if (!fullName) { showMsg('Please enter a full name.', false); return; }
  if (!group)    { showMsg('Please choose a group.', false); return; }

  submitBtn.disabled = true;
  submitBtn.dataset.loading = '1';
  showMsg('Saving…', null);
  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fullName: fullName, group: group, phone: phone })
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || 'Save failed');
    showMsg('✓ ' + fullName + ' registered!', true);
    ev.target.reset();
    clearGroupSelection();
    loadCounts();
  } catch (e) {
    showMsg('Could not save — check your connection and tap Register again.', false);
  } finally {
    submitBtn.disabled = false;
    delete submitBtn.dataset.loading;
  }
});

function showMsg(text, ok) {
  formMsg.textContent = text;
  formMsg.dataset.state = ok === true ? 'ok' : ok === false ? 'err' : 'info';
  formMsg.hidden = false;
}
```

`clearGroupSelection()` resets `#group` value and removes the selected style from the
group buttons.

- [ ] **Step 5: Verify form visually**

Temporarily bypass the lock (or unlock with the passcode) and screenshot:
`node screenshot.mjs http://localhost:3000/register.html form`
Read PNG. Confirm header cards, form fields, group buttons, spacing, brand match.
Fix and re-screenshot (≥2 rounds).

- [ ] **Step 6: Commit**

```bash
git add register.html
git commit -m "feat: add count header, form, live counts and submit"
```

---

### Task 4: Setup guide (`SETUP.md`)

**Files:**
- Create: `SETUP.md`

- [ ] **Step 1: Write non-technical setup steps**

Cover, in order, with screenshots-of-words clarity:
1. Create a Google Sheet (any name).
2. Extensions → Apps Script; paste `apps-script.gs`; Save.
3. Deploy → New deployment → Web app; Execute as **Me**; Who has access **Anyone**;
   Deploy; authorize; **copy the Web App URL**.
4. Open `register.html`, paste the URL into `const SCRIPT_URL = "..."`.
5. Confirm the passcode line `const PASSCODE = "SOFTFAMDAY26"` (change if desired).
6. Test: open `/register.html`, unlock, register a test person, confirm the row in the
   Sheet and that header counts update. Visiting the Web App URL directly shows the
   live counts JSON.
7. Publish the site (so committee can reach `/register.html`).
8. Managing data: open the Sheet to sort/filter/export; delete the test row when done.

- [ ] **Step 2: Commit**

```bash
git add SETUP.md
git commit -m "docs: add committee setup guide"
```

---

### Task 5: Link from main site (optional connective tissue)

**Files:**
- Modify: `index.html`

- [ ] **Step 1:** Confirm with user whether a (discreet/unadvertised) link to
  `register.html` should exist in `index.html`. Per the security design the page is
  unadvertised, so default is **no public link** — committee gets the URL directly.
  Skip unless the user asks.

---

## Self-Review

- **Spec coverage:** backend (Task 1), lock screen + passcode (Task 2), form +
  optional phone + group choices + live totals + grand total + error/offline handling
  (Task 3), SETUP.md (Task 4), hosting-with-main-site (page in root; Task 5 covers
  linking). All spec sections mapped.
- **Placeholder scan:** `SCRIPT_URL` placeholder is intentional config the user fills
  in (documented in SETUP). No TODO/TBD in logic.
- **Type consistency:** element ids (`cChildren/cYoung/cPastor/cTotal`, `fullName`,
  `group`, `phone`, `submitBtn`, `formMsg`, `regForm`), `loadCounts()`, `showMsg()`,
  `clearGroupSelection()`, `unlock()` consistent across tasks. POST body keys
  (`fullName/group/phone`) match Apps Script `doPost`. GET keys (`Children/Young
  People/Pastor & Elders/total`) match `doGet`.
