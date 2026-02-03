/** auth.gs
 * Authentication, token management, and invite system
 * FIXED: Proper row handling for invite acceptance
 */

function ensureTokensTab_() {
  var ss = openCore_();
  var name = 'Tokens';
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1,1,1,5).setValues([['token','email','created_utc','expires_utc','status']]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function issueToken_(email) {
  var sh = ensureTokensTab_();
  var token = randToken_(40);
  var created = nowUtc_();
  var expires = new Date(created.getTime() + APP.TOKEN_TTL_HOURS * 3600 * 1000);
  sh.appendRow([token, safeLower_(email), isoDate_(created), isoDate_(expires), 'Active']);
  return token;
}

function validateToken_(token) {
  token = String(token || '').trim();
  if (!token) return null;
  var sh = ensureTokensTab_();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === token) {
      var status = String(data[i][4] || '').trim();
      if (status !== 'Active') return null;
      var exp = new Date(String(data[i][3]));
      if (new Date() > exp) return null;
      return String(data[i][1]).trim();
    }
  }
  return null;
}

function revokeToken_(token) {
  token = String(token || '').trim();
  if (!token) return false;
  var sh = ensureTokensTab_();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === token) {
      sh.getRange(i+1, 5).setValue('Revoked');
      return true;
    }
  }
  return false;
}

function handleLogin_(email, password) {
  var u = findUserByEmail_(email);
  if (!u) return { success:false, error:'Authentication failed' };
  var h = headerMap_(u.headers);
  if (String(u.row[h.status] || 'Active').trim() !== 'Active') return { success:false, error:'User inactive' };

  var hash = hashPassword_(password);
  var stored = String(u.row[h.password_hash] || '').trim();
  if (!stored || stored !== hash) return { success:false, error:'Authentication failed' };

  var token = issueToken_(email);
  setProp_(APP.PROP_LAST_AUTH_EMAIL, email); // Track last authenticated user for invite creation
  
  return {
    success:true,
    token: token,
    user: {
      email: safeLower_(email),
      name: String(u.row[h.name] || '').trim(),
      access_role: String(u.row[h.access_role] || '').trim()
    }
  };
}

function requireAuth_(params) {
  var token = (params && (params.token || params.Authorization || params.authorization)) || '';
  token = String(token).replace(/^Bearer\s+/i,'').trim();
  var email = validateToken_(token);
  if (!email) return { ok:false, error:'Unauthorized' };
  return { ok:true, email: email };
}

/* ==================== INVITE SYSTEM ==================== */

function ensureInvitesTab_() {
  var ss = openCore_();
  var name = APP.CORE_TABS.INVITES;
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1,1,1,10).setValues([['invite_code','email','role','department','position_id','employment_type','invited_by','status','created_date','accepted_date']]);
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}

function generateInviteCode_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var out = '';
  for (var i = 0; i < 10; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function getWebAppUrl_() {
  return String(getProp_(APP.PROP_WEB_APP_URL) || ScriptApp.getService().getUrl() || '').trim();
}

function buildInviteLink_(inviteCode) {
  inviteCode = encodeURIComponent(String(inviteCode || '').trim());
  return getWebAppUrl_() + '?ui=invite&code=' + inviteCode;
}

function createInvite_(email, role, department, position_id, employment_type) {
  var caller = String(getProp_(APP.PROP_LAST_AUTH_EMAIL) || '').trim().toLowerCase();
  if (!caller) return { success:false, error:'Not authenticated' };

  var nav = buildNavTree_(caller);
  var can = nav.pages && nav.pages.some(function(p){ return p.page_id === 'hr_invite'; });
  if (!can) return { success:false, error:'Forbidden' };

  email = String(email || '').trim().toLowerCase();
  role = String(role || '').trim();
  department = String(department || '').trim();
  position_id = String(position_id || '').trim();
  employment_type = String(employment_type || '').trim();

  if (!email) return { success:false, error:'Missing email' };
  if (!role) role = 'employee';

  var sh = ensureInvitesTab_();
  var data = sh.getDataRange().getValues();
  
  // Check for existing pending invite
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === email && String(data[i][7]).toLowerCase() === 'pending') {
      var exCode = String(data[i][0]).trim();
      return { success:true, invite_code: exCode, already_exists:true, link: buildInviteLink_(exCode) };
    }
  }

  var code = generateInviteCode_();
  var now = Utilities.formatDate(new Date(), 'Etc/UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");
  sh.appendRow([code, email, role, department, position_id, employment_type, caller, 'Pending', now, '']);
  return { success:true, invite_code: code, link: buildInviteLink_(code) };
}

function acceptInvite_(inviteCode, name, password) {
  inviteCode = String(inviteCode || '').trim();
  name = String(name || '').trim();
  if (!inviteCode) return {success:false, error:'Missing invite code'};
  if (!name) return {success:false, error:'Missing name'};
  if (!password) return {success:false, error:'Missing password'};

  var core = openCore_();
  var shInv = ensureInvitesTab_();
  var shUsers = core.getSheetByName(APP.CORE_TABS.USERS);
  if (!shInv || !shUsers) return {success:false, error:'Core sheets missing'};

  var invData = shInv.getDataRange().getValues();
  var invRowIndex = -1;
  var invRow = null;
  
  // Find invite
  for (var i = 1; i < invData.length; i++) {
    if (String(invData[i][0]).trim() === inviteCode && String(invData[i][7]).toLowerCase() === 'pending') {
      invRowIndex = i + 1; // Sheet row number (1-indexed, accounting for header)
      invRow = invData[i];
      break;
    }
  }
  
  if (!invRow) return {success:false, error:'Invite not found or already used'};

  var email = String(invRow[1] || '').trim().toLowerCase();
  var role = String(invRow[2] || '').trim() || 'employee';
  var department = String(invRow[3] || '').trim() || '';
  if (!email) return {success:false, error:'Invite missing email'};

  // Check if user already exists
  var userData = shUsers.getDataRange().getValues();
  var userRowIndex = -1;
  for (var i = 1; i < userData.length; i++) {
    if (String(userData[i][0]).trim().toLowerCase() === email) {
      userRowIndex = i + 1;
      break;
    }
  }

  var hash = hashPassword_(password);
  var now = Utilities.formatDate(new Date(), 'Etc/UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");

  if (userRowIndex === -1) {
    // Create new user
    shUsers.appendRow([email, name, hash, role, 'Active']);
  } else {
    // Update existing user
    shUsers.getRange(userRowIndex, 2).setValue(name);
    shUsers.getRange(userRowIndex, 3).setValue(hash);
    shUsers.getRange(userRowIndex, 4).setValue(role);
    shUsers.getRange(userRowIndex, 5).setValue('Active');
  }

  // Mark invite as accepted
  shInv.getRange(invRowIndex, 8).setValue('Accepted');
  shInv.getRange(invRowIndex, 10).setValue(now);

  return {success:true};
}

function listPendingInvites_(token) {
  var auth = requireAuth_({token: token});
  if (!auth.ok) return { success:false, error: auth.error };

  var nav = buildNavTree_(auth.email);
  var can = nav.pages && nav.pages.some(function(p){ return p.page_id === 'hr_invite'; });
  if (!can) return { success:false, error:'Forbidden' };

  var sh = ensureInvitesTab_();
  var data = sh.getDataRange().getValues();
  var invites = [];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][7]).toLowerCase() === 'pending') {
      invites.push({
        invite_code: data[i][0],
        email: data[i][1],
        role: data[i][2],
        department: data[i][3],
        invited_by: data[i][6],
        created_date: data[i][8],
        link: buildInviteLink_(data[i][0])
      });
    }
  }
  
  return { success:true, invites: invites };
}

function revokeInvite_(token, inviteCode) {
  var auth = requireAuth_({token: token});
  if (!auth.ok) return { success:false, error: auth.error };

  var nav = buildNavTree_(auth.email);
  var can = nav.pages && nav.pages.some(function(p){ return p.page_id === 'hr_invite'; });
  if (!can) return { success:false, error:'Forbidden' };

  inviteCode = String(inviteCode || '').trim();
  if (!inviteCode) return { success:false, error:'Missing invite code' };

  var sh = ensureInvitesTab_();
  var data = sh.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === inviteCode) {
      sh.getRange(i + 1, 8).setValue('Revoked');
      return { success:true };
    }
  }
  
  return { success:false, error:'Invite not found' };
}
