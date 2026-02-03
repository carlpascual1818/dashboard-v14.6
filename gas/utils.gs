/** utils.gs */

function nowUtc_() {
  return new Date();
}

function isoDate_(d) {
  return Utilities.formatDate(d, 'Etc/UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function jsonOut_(obj, statusCode) {
  var o = ContentService.createTextOutput(JSON.stringify(obj));
  o.setMimeType(ContentService.MimeType.JSON);
  // ContentService does not allow setting status code directly in Web Apps.
  // We include status in payload; client checks obj.success.
  return o;
}

function randToken_(len) {
  len = len || 32;
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var out = '';
  for (var i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function getProp_(k) {
  return PropertiesService.getScriptProperties().getProperty(k);
}

function setProp_(k, v) {
  PropertiesService.getScriptProperties().setProperty(k, String(v));
}

function delProp_(k) {
  PropertiesService.getScriptProperties().deleteProperty(k);
}

function ensureSalt_() {
  var salt = getProp_(APP.PROP_SALT);
  if (!salt) {
    salt = randToken_(32);
    setProp_(APP.PROP_SALT, salt);
  }
  return salt;
}

function hashPassword_(password) {
  var salt = ensureSalt_();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '::' + password, Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    var v = (b < 0) ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function safeLower_(s) {
  return String(s || '').trim().toLowerCase();
}

function isBlank_(v) {
  return v === null || v === undefined || String(v).trim() === '';
}

function cacheGet_(key) {
  return CacheService.getScriptCache().get(key);
}

function cachePut_(key, value, ttlSec) {
  CacheService.getScriptCache().put(key, value, ttlSec || APP.CACHE_TTL_SEC);
}

function sheetByName_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name + ' in ' + ss.getName());
  return sh;
}

function ensureTab_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  if (headers && headers.length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendRows_(sh, rows) {
  if (!rows || !rows.length) return;
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function headerMap_(headers) {
  var m = {};
  for (var i = 0; i < headers.length; i++) {
    m[String(headers[i]).trim()] = i;
  }
  return m;
}

function readTable_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 1) return { headers: [], rows: [] };
  var headers = values[0].map(function(x) { return String(x).trim(); });
  var rows = values.slice(1).filter(function(r) { return r.some(function(v){ return !isBlank_(v); }); });
  return { headers: headers, rows: rows };
}

function readHeaders_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 1) return [];
  return values[0].map(function(x) { return String(x).trim(); });
}


// Service URL (Web App /exec)
function getServiceUrl_() {
  return ScriptApp.getService().getUrl();
}

// Append row by headers using object values
function appendRow_(sheet, headers, obj) {
  headers = headers || readHeaders_(sheet);
  var row = headers.map(function(h){ return (obj && obj.hasOwnProperty(h)) ? obj[h] : ''; });
  sheet.appendRow(row);
}

// Update a row by headers (only provided keys)
function writeRowByHeaders_(sheet, rowNumber, headers, obj) {
  headers = headers || readHeaders_(sheet);
  var range = sheet.getRange(rowNumber, 1, 1, headers.length);
  var values = range.getValues()[0];
  headers.forEach(function(h, i){
    if (obj && obj.hasOwnProperty(h)) values[i] = obj[h];
  });
  range.setValues([values]);
}
