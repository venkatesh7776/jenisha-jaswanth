const SPREADSHEET_ID = "15GUdtqNrVlGdpSVG2pbRdEiKAk82T5H0Ddp8SUF_Vyo";
const SHEET_NAME = "RSVP Responses";

// Test whether the API is running
function doGet() {
  return ContentService
    .createTextOutput("Wedding RSVP API is running successfully!")
    .setMimeType(ContentService.MimeType.TEXT);
}

// Finds the "RSVP Responses" tab, or creates it with headings if it doesn't exist
function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "Guest Name", "Attending", "Guest Count"]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Receive RSVP submissions from the wedding website
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.guestName) {
      throw new Error("Guest name is required.");
    }

    lock.waitLock(10000);   // prevent simultaneous submissions from conflicting

    const attending = data.attending === "No" ? "No" : "Yes";
    getSheet_().appendRow([
      new Date(),
      String(data.guestName).trim(),
      attending,
      attending === "Yes" ? (Number(data.guestCount) || 1) : 0
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "RSVP submitted successfully!" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
