// ============================================================
// SOFT Family Day 2026 — Registration backend (Google Apps Script)
//
// SETUP (see SETUP.md for the full walkthrough):
//   1. Open your Google Sheet → Extensions → Apps Script.
//   2. Delete any sample code, paste this whole file, and Save.
//   3. Deploy → New deployment → type "Web app".
//        Execute as:      Me
//        Who has access:  Anyone
//      Deploy, authorize, and COPY the Web App URL.
//   4. Paste that URL into register.html (const SCRIPT_URL = "...").
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

// GET → return live counts per group + grand total
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
