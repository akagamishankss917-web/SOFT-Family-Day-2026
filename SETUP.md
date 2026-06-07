# SOFT Family Day 2026 — Registration Setup Guide

This guide walks a non-technical committee admin through connecting the
registration page to a Google Sheet. It takes about 10 minutes, one time only.

**What you'll end up with:**
- A registration page (`register.html`) committee members open on their phones.
- A Google Sheet that fills up automatically with every registration.
- A passcode that keeps the page committee-only.

---

## Step 1 — Create the Google Sheet

1. Go to <https://sheets.google.com> and click **Blank spreadsheet**.
2. Name it anything you like, e.g. **SOFT Family Day Registrations**.
3. Leave it empty — the script creates the column headers automatically.

## Step 2 — Add the script

1. In the Sheet's menu, click **Extensions → Apps Script**.
2. A code editor opens in a new tab. Delete any sample code shown
   (`function myFunction() { ... }`).
3. Open the file **`apps-script.gs`** (in this project), copy **all** of it, and
   paste it into the Apps Script editor.
4. Click the **Save** icon (💾).

## Step 3 — Publish the Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon ⚙ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `Registration` (anything is fine)
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy**.
5. Google asks you to authorize. Click **Authorize access**, pick your Google
   account, and on the "Google hasn't verified this app" screen click
   **Advanced → Go to (your project)** → **Allow**. (This is normal for your own
   scripts.)
6. Copy the **Web app URL** shown. It looks like:
   `https://script.google.com/macros/s/AKfy.....long.....string/exec`

> Keep this URL — you need it in the next step.

## Step 4 — Connect the page to the Sheet

1. Open **`register.html`** in a text editor (Notepad, VS Code, etc.).
2. Near the bottom, find these two lines inside the `<script>` block:

   ```javascript
   const PASSCODE   = "SOFTFAMDAY26";
   const SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```

3. Replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the Web app URL you
   copied (keep the quotes):

   ```javascript
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfy...../exec";
   ```

4. The passcode is already set to **`SOFTFAMDAY26`**. To change it, edit the text
   between the quotes on the `PASSCODE` line.
5. Save the file.

## Step 5 — Test it

1. Open the page in a browser. (If publishing with the main site, it lives at
   `your-site-address/register.html`. To test locally, run `node serve.mjs` in the
   project folder and open <http://localhost:3000/register.html>.)
2. Enter the passcode **`SOFTFAMDAY26`** and click **Unlock**.
3. Register a test person: type a name, tap a group, click **Register Guest**.
   You should see a green "✓ … registered!" message.
4. Switch to your Google Sheet — a new row should appear with the timestamp,
   name, group, and phone.
5. The count cards at the top of the page should update to reflect the new total.
6. (Optional) Paste the Web app URL directly into a browser — it returns the live
   counts as text, e.g. `{"Children":1,"Young People":0,"Pastor & Elders":0,"total":1}`.
7. Delete the test row from the Sheet when you're done.

## Step 6 — Share with committee members

1. Publish the site so the page has a public address (e.g. GitHub Pages, Netlify,
   or Cloudflare Pages — `register.html` deploys together with `index.html`).
2. Share the `register.html` link **and** the passcode privately with committee
   members only. The page is not linked from the main site, so only people with
   the link and passcode can use it.

---

## Managing the data

- Open the Google Sheet any time to **sort, filter, or export** registrations
  (File → Download → Excel/CSV).
- Columns are: **Timestamp · Full Name · Group · Phone**.
- To get a fresh count, just reload the registration page — the header always
  reflects the whole Sheet.

## Good to know

- **Phone is optional** — a registration saves fine without it.
- **Re-deploying after edits:** if you change `apps-script.gs` later, click
  **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy** so the
  changes go live. The URL stays the same.
- **Security note:** the passcode is a light gate to keep casual visitors out — it
  is suitable for an internal event tool, but anyone technical who inspects the
  page can read the passcode. Don't store sensitive data here, and don't link the
  page publicly.
- **No signal?** If a phone loses connection mid-registration, the page shows a red
  "Could not save…" message so the steward can tap **Register Guest** again — no
  registration is lost silently.
