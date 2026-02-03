/** security.gs
 * Row-level security based on People Directory in TEAM spreadsheet.
 */

function getPeopleDirectory_() {
  var ss = openGroup_(APP.GROUPS.TEAM);
  var sh = sheetByName_(ss, 'people_directory');
  return readTable_(sh);
}

function getPersonByEmail_(email) {
  var t = getPeopleDirectory_();
  var h = headerMap_(t.headers);
  var em = safeLower_(email);
  for (var i=0;i<t.rows.length;i++){
    if (safeLower_(t.rows[i][h.email]) === em) return { headers:t.headers, row:t.rows[i] };
  }
  return null;
}

function getPersonByEmployeeId_(employeeId) {
  var t = getPeopleDirectory_();
  var h = headerMap_(t.headers);
  for (var i=0;i<t.rows.length;i++){
    if (String(t.rows[i][h.employee_id]).trim() === String(employeeId).trim()) return { headers:t.headers, row:t.rows[i] };
  }
  return null;
}

function getViewerContext_(email) {
  var accessRole = getUserAccessRole_(email);
  var person = getPersonByEmail_(email);
  var dept = person ? String(person.row[headerMap_(person.headers).department]||'').trim() : '';
  var empId = person ? String(person.row[headerMap_(person.headers).employee_id]||'').trim() : '';
  return { email: safeLower_(email), access_role: accessRole, department: dept, employee_id: empId };
}

function rowAllowed_(viewer, rowObj) {
  // viewer: {access_role, department, employee_id}
  // rowObj: must include employee_id, department, backup_employee_id
  var role = viewer.access_role;
  if (role === 'owner') return true;
  if (role === 'hr') {
    // HR can see HR pages only; page-level permission handles that.
    // For People Directory, HR can see all people.
    return true;
  }
  if (role === 'finance') {
    // Finance sees Team Directory, but not HR pages.
    // For People Directory, finance sees all.
    return true;
  }
  if (role === 'operations') {
    // Operations sees Team Directory, and ops pages. For people lists, show all by default.
    return true;
  }
  if (role === 'manager') {
    // Manager sees only their department, plus backup rows where they are backup.
    if (viewer.department && rowObj.department && viewer.department === rowObj.department) return true;
    if (viewer.employee_id && rowObj.backup_employee_id && viewer.employee_id === rowObj.backup_employee_id) return true;
    return false;
  }
  // employee
  if (viewer.employee_id && rowObj.employee_id && viewer.employee_id === rowObj.employee_id) return true;
  if (viewer.employee_id && rowObj.backup_employee_id && viewer.employee_id === rowObj.backup_employee_id) return true;
  return false;
}

function filterRowsForViewer_(viewer, headers, rows) {
  var hm = headerMap_(headers);
  var out = [];
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    var obj = {
      employee_id: String(r[hm.employee_id]||'').trim(),
      department: String(r[hm.department]||'').trim(),
      backup_employee_id: String(r[hm.backup_employee_id]||'').trim()
    };
    if (rowAllowed_(viewer, obj)) out.push(r);
  }
  return out;
}
