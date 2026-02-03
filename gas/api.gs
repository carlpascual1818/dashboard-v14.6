/* api.gs
 * Single Web App entry point.
 *
 * UI routes:
 *   /exec?ui=login
 *   /exec?ui=portal
 *   /exec?ui=dashboard&page_id=...
 *   /exec?ui=invites
 *   /exec?ui=invite&code=...
 *
 * API (POST) actions:
 *   login, nav, page, upsertRow, deleteRow,
 *   listInvites, createInvite, revokeInvite, acceptInvite,
 *   initDashboard (alias: init), logout
 */

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var ui = String(params.ui || '').trim();

  if (ui === 'invite') {
    return serveUi_('invite_user', {
      invite_code: String(params.code || '').trim()
    });
  }

  if (ui === 'invites') return serveUi_('invites', {});
  if (ui === 'portal') return serveUi_('portal', {});

  if (ui === 'dashboard') {
    return serveUi_('dashboard', {
      page_id: String(params.page_id || '').trim()
    });
  }

  return serveUi_('login', {});
}

function doPost(e) {
  var body = parseBody_(e);

  // Support a few common variants
  var action = String(body.action || body.Action || body.ACT || '').trim();
  if (action.indexOf('.') > -1) action = action.split('.').pop();

  if (action === 'login') {
    return jsonOut_(handleLogin_(body.email, body.password));
  }
  if (action === 'nav') {
    return jsonOut_(getNav_(body.token));
  }
  if (action === 'page') {
    return jsonOut_(getPage_(body.token, body.page_id));
  }
  if (action === 'upsertRow') {
    return jsonOut_(upsertRow_(body.token, body.table, body.row));
  }
  if (action === 'deleteRow') {
    return jsonOut_(deleteRow_(body.token, body.table, body.row_id));
  }
  if (action === 'listInvites') {
    return jsonOut_(listPendingInvites_(body.token));
  }
  if (action === 'revokeInvite') {
    return jsonOut_(revokeInvite_(body.token, body.invite_code));
  }
  if (action === 'createInvite') {
    return jsonOut_(createInvite_(body.email, body.role, body.department, body.position_id, body.employment_type));
  }
  if (action === 'acceptInvite') {
    return jsonOut_(acceptInvite_(body.invite_code, body.name, body.password));
  }
  if (action === 'initDashboard' || action === 'init') {
    return jsonOut_(initDashboard());
  }
  if (action === 'logout') {
    revokeToken_(body.token);
    return jsonOut_({ success:true });
  }

  return jsonOut_({
    success:false,
    error: action ? ('Unknown action: ' + action) : 'Missing action'
  });
}

function parseBody_(e) {
  var out = {};

  // Merge querystring params
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    Object.keys(p).forEach(function(k){ out[k] = p[k]; });
  } catch (ignore1) {}

  // Merge POST body
  try {
    if (e && e.postData && e.postData.contents != null) {
      var ct = String(e.postData.type || '').toLowerCase();
      var raw = String(e.postData.contents || '');

      if (ct.indexOf('application/json') > -1) {
        try {
          var j = JSON.parse(raw || '{}');
          if (j && typeof j === 'object') {
            Object.keys(j).forEach(function(k){ out[k] = j[k]; });
          }
        } catch (jsonErr) {
          var q1 = parseQueryString_(raw);
          Object.keys(q1).forEach(function(k){ out[k] = q1[k]; });
        }
      } else {
        var q2 = parseQueryString_(raw);
        Object.keys(q2).forEach(function(k){ out[k] = q2[k]; });
      }
    }
  } catch (ignore2) {}

  return out;
}

function parseQueryString_(s) {
  var out = {};
  if (!s) return out;

  var parts = String(s).split('&');
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split('=');
    if (!kv[0]) continue;

    var k = decodeURIComponent(kv[0].replace(/\+/g, ' '));
    var v = decodeURIComponent(String(kv.slice(1).join('=') || '').replace(/\+/g, ' '));
    out[k] = v;
  }
  return out;
}

function serveUi_(fileName, data) {
  var t = HtmlService.createTemplateFromFile(fileName);
  t.apiUrl = getServiceUrl_();
  if (data) {
    Object.keys(data).forEach(function(k){ t[k] = data[k]; });
  }

  return t.evaluate()
    .setTitle('COO Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getServiceUrl_() {
  // This returns the /exec URL of the deployed Web App.
  // In the editor preview it may return null, so fall back to empty string.
  return ScriptApp.getService().getUrl() || '';
}
