/** storage.gs */

function getCoreId_() {
  return getProp_(APP.PROP_CORE_ID);
}
function getTeamId_() {
  return getProp_(APP.PROP_TEAM_ID);
}
function getOpsId_() {
  return getProp_(APP.PROP_OPS_ID);
}
function getFinId_() {
  return getProp_(APP.PROP_FIN_ID);
}

function openCore_() {
  var id = getCoreId_();
  if (!id) throw new Error('CORE sheet not set. Run initDashboard().');
  return SpreadsheetApp.openById(id);
}

function openGroup_(groupKey) {
  var id = null;
  if (groupKey === APP.GROUPS.TEAM) id = getTeamId_();
  if (groupKey === APP.GROUPS.OPS) id = getOpsId_();
  if (groupKey === APP.GROUPS.FIN) id = getFinId_();
  if (groupKey === APP.GROUPS.HR) id = getTeamId_();
  if (!id) throw new Error('Sheet ID missing for group: ' + groupKey + '. Run initDashboard().');
  return SpreadsheetApp.openById(id);
}
