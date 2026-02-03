/** config.gs
 * All config is stored in CORE spreadsheet tabs.
 * No hardcoded IDs. No code changes needed to change navigation or permissions.
 */

function tableToObjects_(t) {
  if (!t || !t.headers || !t.rows) return [];
  var headers = t.headers;
  var out = [];
  for (var i = 0; i < t.rows.length; i++) {
    var row = t.rows[i];
    var o = {};
    for (var j = 0; j < headers.length; j++) {
      o[headers[j]] = row[j];
    }
    out.push(o);
  }
  return out;
}

function getRoles_() {
  var cacheKey = 'roles';
  var cached = cacheGet_(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = openCore_();
  var t = readTable_(sheetByName_(ss, APP.CORE_TABS.ROLES));
  cachePut_(cacheKey, JSON.stringify(t), APP.CACHE_TTL_SEC);
  return t;
}

function getCategories_() {
  var cacheKey = 'cats';
  var cached = cacheGet_(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = openCore_();
  var t = readTable_(sheetByName_(ss, APP.CORE_TABS.CATEGORIES));
  cachePut_(cacheKey, JSON.stringify(t), APP.CACHE_TTL_SEC);
  return t;
}

function getPages_() {
  var cacheKey = 'pages';
  var cached = cacheGet_(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = openCore_();
  var t = readTable_(sheetByName_(ss, APP.CORE_TABS.PAGES));
  cachePut_(cacheKey, JSON.stringify(t), APP.CACHE_TTL_SEC);
  return t;
}

function getPermissions_() {
  var cacheKey = 'perms';
  var cached = cacheGet_(cacheKey);
  if (cached) return JSON.parse(cached);

  var ss = openCore_();
  var t = readTable_(sheetByName_(ss, APP.CORE_TABS.PERMISSIONS));
  cachePut_(cacheKey, JSON.stringify(t), APP.CACHE_TTL_SEC);
  return t;
}

function getUsers_() {
  var ss = openCore_();
  return readTable_(sheetByName_(ss, APP.CORE_TABS.USERS));
}

function findUserByEmail_(email) {
  var em = safeLower_(email);
  var t = getUsers_();
  var h = headerMap_(t.headers);
  for (var i = 0; i < t.rows.length; i++) {
    var r = t.rows[i];
    if (safeLower_(r[h.email]) === em) return { headers: t.headers, row: r };
  }
  return null;
}

function getUserAccessRole_(email) {
  var u = findUserByEmail_(email);
  if (!u) return null;
  var h = headerMap_(u.headers);
  return String(u.row[h.access_role] || '').trim();
}

function buildNavTree_(email) {
  // Build a nested category tree with pages[] on each category.
  // Applies role-based page filtering via Config_Permissions, de-dupes pages by page_id,
  // sorts by order, and prunes empty categories.
  var role = getUserAccessRole_(email) || '';
  var roleLower = String(role).toLowerCase().trim();

  var cats = tableToObjects_(getCategories_());
  var pages = tableToObjects_(getPages_());
  var perms = tableToObjects_(getPermissions_());

  // Allowed page_ids for this role
  var allow = {};
  perms.forEach(function(p) {
    // Support both header styles: role (new) and role_id (older sheets)
    var r = String(p.role || p.role_id || '').toLowerCase().trim();
    var pid = String(p.page_id || '').trim();
    var can = String(p.can_view || '').toLowerCase().trim();
    if (!pid) return;
    if (r === roleLower && (can === 'true' || can === 'yes' || can === '1')) {
      allow[pid] = true;
    }
  });

  // Category map
  var catMap = {};
  cats.forEach(function(c) {
    if (String(c.status || '').toLowerCase() !== 'active') return;
    var id = String(c.category_id || '').trim();
    if (!id) return;
    catMap[id] = {
      category_id: id,
      // Support both header styles: parent_category_id (new) and parent_category (older sheets)
      parent_category_id: String(c.parent_category_id || c.parent_category || '').trim(),
      // Support multiple possible name headers
      display_name: String(c.display_name || c.category_name || c.name || id),
      order: Number(c.order || 0),
      icon: String(c.icon || ''),
      pages: [],
      children: []
    };
  });

  // De-dupe pages by page_id and attach to categories
  var seen = {};
  pages.forEach(function(p) {
    if (String(p.status || '').toLowerCase() !== 'active') return;
    var pid = String(p.page_id || '').trim();
    if (!pid || seen[pid]) return;
    seen[pid] = true;

    if (!allow[pid]) return;

    var cid = String(p.category_id || '').trim();
    if (!cid || !catMap[cid]) return;

    catMap[cid].pages.push({
      page_id: pid,
      category_id: cid,
      display_name: String(p.display_name || pid),
      order: Number(p.order || 0),
      sheet_group: String(p.sheet_group || ''),
      tab_name: String(p.tab_name || ''),
      view_type: String(p.view_type || 'table'),
      chart_type: String(p.chart_type || ''),
      x_axis: String(p.x_axis || ''),
      y_axis: String(p.y_axis || ''),
      group_by: String(p.group_by || ''),
      status: String(p.status || '')
    });
  });

  // Sort pages per category
  Object.keys(catMap).forEach(function(k) {
    catMap[k].pages.sort(function(a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.display_name).localeCompare(String(b.display_name));
    });
  });

  // Build category tree
  var roots = [];
  Object.keys(catMap).forEach(function(k) {
    var c = catMap[k];
    var parentId = c.parent_category_id;
    if (parentId && catMap[parentId]) {
      catMap[parentId].children.push(c);
    } else {
      roots.push(c);
    }
  });

  function sortCats(arr) {
    arr.sort(function(a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.display_name).localeCompare(String(b.display_name));
    });
    arr.forEach(function(c) {
      if (c.children && c.children.length) sortCats(c.children);
    });
  }

  function prune(cat) {
    var keptChildren = [];
    (cat.children || []).forEach(function(ch) {
      var kept = prune(ch);
      if (kept) keptChildren.push(kept);
    });
    cat.children = keptChildren;

    var hasPages = (cat.pages && cat.pages.length);
    var hasChildren = (cat.children && cat.children.length);
    if (!hasPages && !hasChildren) return null;
    return cat;
  }

  roots = roots.map(prune).filter(function(x){ return !!x; });
  sortCats(roots);

  var flatPages = [];
  function collectPages(cat) {
    if (cat.pages && cat.pages.length) {
      cat.pages.forEach(function(p) { flatPages.push(p); });
    }
    (cat.children || []).forEach(collectPages);
  }
  roots.forEach(collectPages);

  return { role: role, categories: roots, pages: flatPages };
}

function getPageById_(pageId) {
  var t = getPages_();
  var h = headerMap_(t.headers);
  for (var i = 0; i < t.rows.length; i++) {
    if (String(t.rows[i][h.page_id]).trim() === String(pageId).trim()) {
      return {
        page_id: String(t.rows[i][h.page_id]).trim(),
        category_id: String(t.rows[i][h.category_id]).trim(),
        display_name: String(t.rows[i][h.display_name]).trim(),
        sheet_group: String(t.rows[i][h.sheet_group]).trim(),
        tab_name: String(t.rows[i][h.tab_name]).trim(),
        view_type: String(t.rows[i][h.view_type]).trim(),
        chart_type: String(t.rows[i][h.chart_type]).trim(),
        x_axis: String(t.rows[i][h.x_axis]).trim(),
        y_axis: String(t.rows[i][h.y_axis]).trim(),
        group_by: String(t.rows[i][h.group_by]).trim(),
        status: String(t.rows[i][h.status] || 'Active').trim()
      };
    }
  }
  return null;
}
