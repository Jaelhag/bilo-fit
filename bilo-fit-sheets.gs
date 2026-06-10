/**
 * Bilo Fit → Google Sheets sync endpoint.
 * Paste this into your "Bilo Fit Data" sheet: Extensions → Apps Script.
 * Then Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone.
 * Copy the /exec URL and paste it into Bilo Fit (More → Google Sheets).
 */
function doGet() {
  return json({ ok: true, msg: 'Bilo Fit sync endpoint is live.' });
}
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    writeBP(ss, data);
    writeSleep(ss, data);
    writeWeight(ss, data);
    writeMeds(ss, data);
    writeMedCompliance(ss, data);
    writeStrength(ss, data);
    writeWorkouts(ss, data);
    return json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function tab(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sh.setFrozenRows(1);
  return sh;
}
function rows(sh, data) {
  if (data.length) sh.getRange(2, 1, data.length, data[0].length).setValues(data);
}
function classifyBP(s, d) {
  if (!s || !d) return '';
  if (s > 180 || d > 120) return 'Crisis';
  if (s >= 140 || d >= 90) return 'High 2';
  if (s >= 130 || d >= 80) return 'High 1';
  if (s >= 120 && d < 80) return 'Elevated';
  return 'Normal';
}
function writeBP(ss, data) {
  var sh = tab(ss, 'Blood Pressure', ['Date', 'Systolic', 'Diastolic', 'Pulse', 'Category', 'Note']);
  rows(sh, (data.bpLog || []).map(function (x) {
    return [x.date, x.sys, x.dia, x.pulse || '', classifyBP(x.sys, x.dia), x.note || ''];
  }));
}
function writeSleep(ss, data) {
  var sh = tab(ss, 'Sleep', ['Date', 'Bedtime', 'Wake', 'Hours', 'Quality(1-5)', 'Woke Up', 'Note']);
  rows(sh, (data.sleepLog || []).map(function (x) {
    return [x.date, x.bedtime || '', x.wakeTime || '', x.durationHours || '', x.quality || '', x.disruptions ? 'Yes' : 'No', x.note || ''];
  }));
}
function writeWeight(ss, data) {
  var sh = tab(ss, 'Weight', ['Date', 'Weight (lb)', 'Note']);
  rows(sh, (data.weightLog || []).map(function (x) { return [x.date, x.weight, x.note || '']; }));
}
function writeMeds(ss, data) {
  var sh = tab(ss, 'Medications', ['Medication', 'Strength', 'Dose Label', 'Amount', 'Time']);
  var r = [];
  (data.medications || []).forEach(function (m) {
    (m.doses || []).forEach(function (dz) { r.push([m.name, m.strength || '', dz.label || '', dz.amount || '', dz.time || '']); });
  });
  rows(sh, r);
}
function writeMedCompliance(ss, data) {
  var sh = tab(ss, 'Med Compliance', ['Date', 'Med-Dose', 'Taken', 'Taken At']);
  var r = [], log = data.medLog || {};
  Object.keys(log).sort().forEach(function (day) {
    var es = log[day];
    Object.keys(es).forEach(function (k) { r.push([day, k, es[k].taken ? 'Yes' : 'No', es[k].takenAt || '']); });
  });
  rows(sh, r);
}
function writeStrength(ss, data) {
  var sh = tab(ss, 'Strength (e1RM)', ['Exercise', 'Date', 'Weight', 'Reps', 'e1RM']);
  var r = [], lp = data.liftProgress || {};
  Object.keys(lp).forEach(function (ex) {
    (lp[ex] || []).forEach(function (p) { r.push([ex, p.date, p.weight, p.reps, p.e1rm]); });
  });
  rows(sh, r);
}
function summarize(s) {
  if (!s.data) return '';
  if (s.type === 'echo-bike') return (s.data.protocol || '') + ' ' + (s.data.duration || '') + ' HRmax ' + (s.data.hrMax || '');
  if (s.type === 'zone2') return (s.data.zone2Min || '') + ' min Z2';
  if (s.data.zone2Min) return 'Lift + ' + s.data.zone2Min + ' min Z2';
  return '';
}
function writeWorkouts(ss, data) {
  var sh = tab(ss, 'Workouts', ['Date', 'Category', 'Type', 'Summary', 'Note']);
  var r = [];
  (data.conditioningSessions || []).forEach(function (s) { r.push([s.date, 'Conditioning', s.type, summarize(s), s.note || '']); });
  (data.sessions || []).forEach(function (s) {
    r.push([s.date, 'Mobility', s.goalId, (s.drills || []).map(function (d) { return d.name; }).join(', '), s.note || '']);
  });
  r.sort(function (a, b) { return a[0] < b[0] ? 1 : -1; });
  rows(sh, r);
}
