/** data.gs
 * Fetch data for a page, apply permissions and row-level filtering.
 */

function getPageData_(token, pageId, filters) {
  var auth = requireAuth_({token: token});
  if (!auth.ok) return { success:false, error: auth.error };

  var email = auth.email;
  var nav = buildNavTree_(email);
  var allowed = nav.pages && nav.pages.some(function(p){ return p.page_id === pageId; });
  if (!allowed) return { success:false, error:'Forbidden' };

  var page = getPageById_(pageId);
  if (!page || page.status !== 'Active') return { success:false, error:'Page not found' };

  var ss = openGroup_(page.sheet_group);
  var sh = ss.getSheetByName(page.tab_name);
  if (!sh) return { success:false, error:'Missing tab: ' + page.tab_name };

  var table = readTable_(sh);
  var headers = table.headers;
  var rows = table.rows;

  // Row-level filtering for pages that contain employee_id
  var viewer = getViewerContext_(email);
  var hm = headerMap_(headers);

  var hasEmp = hm.hasOwnProperty('employee_id');
  if (hasEmp) {
    // People Directory is visible to everyone but raw hours are private in other tabs, enforced by permissions.
    rows = filterRowsForViewer_(viewer, headers, rows);
  }

  // Simple filters by header keys
  if (filters) {
    Object.keys(filters).forEach(function(k){
      if (!hm.hasOwnProperty(k)) return;
      var v = String(filters[k]||'').trim();
      if (v === '' || v === 'All') return;
      rows = rows.filter(function(r){ return String(r[hm[k]]||'').trim() === v; });
    });
  }

  return {
    success:true,
    page: { page_id: page.page_id, display_name: page.display_name, view_type: page.view_type },
    headers: headers,
    rows: rows
  };
}

function getPage_(token, pageId, filters) {
  var auth = requireAuth_({token: token});
  if (!auth.ok) return { success:false, error: auth.error };
  var email = auth.email;
  var role = getUserAccessRole_(email) || '';
  var roleLower = String(role).toLowerCase().trim();

  // Enforce permission
  var perms = tableToObjects_(getPermissions_());
  var allowed = false;
  perms.forEach(function(p) {
    var r = String(p.role || p.role_id || '').toLowerCase().trim();
    var pid = String(p.page_id || '').trim();
    var can = String(p.can_view || '').toLowerCase().trim();
    if (r === roleLower && pid === pageId && (can === 'true' || can === 'yes' || can === '1')) allowed = true;
  });
  if (!allowed) return { success:false, error:'Forbidden: you do not have access to this page.' };

  var pageCfg = getPageById_(pageId);
  if (!pageCfg || String(pageCfg.status || '').toLowerCase() !== 'active') {
    return { success:false, error:'Missing or inactive page config: ' + pageId };
  }

  var res = getPageData_(token, pageId, filters || {});
  if (!res.success) return res;

  return {
    success: true,
    page: {
      page_id: pageCfg.page_id,
      display_name: pageCfg.display_name,
      table: pageCfg.tab_name,
      view_type: pageCfg.view_type || 'table',
      chart_type: pageCfg.chart_type || '',
      x_axis: pageCfg.x_axis || '',
      y_axis: pageCfg.y_axis || '',
      group_by: pageCfg.group_by || '',
      columns: res.headers || [],
      rows: res.rows || []
    }
  };
}

function getNav_(token) {
  var auth = requireAuth_({token: token});
  if (!auth.ok) return { success:false, error: auth.error };
  var nav = buildNavTree_(auth.email);
  return { success:true, nav: nav };
}
