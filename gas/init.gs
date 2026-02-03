/** init.gs - Complete COO Dashboard Initialization
 * Creates CORE, TEAM, OPS, FIN spreadsheets with full demo data
 * Run: initDashboard()
 * 
 * Structure:
 * - 1 Owner (Carl)
 * - 8 Managers (CS, Ops, Product, Creative, Media, FB Ads, HR, Finance)
 * - 26 Team members across departments
 * - Total: 35 employees
 * 
 * TEAM Spreadsheet: 25 tabs
 * - Core: people_directory, leave_log, hours_log_daily, positions, open_positions, staffing_health, calc_staffing
 * - Department Matrix/KPIs: cs, disputes, funnel, creative, media_buyer, fb_ads, ops (14 tabs)
 * - HR: hr_employee_database, hr_warnings, hr_matrix, hr_kpis (4 tabs)
 * 
 * OPS Spreadsheet: 4 tabs
 * FIN Spreadsheet: 3 tabs
 */

function initDashboard() {
  var done = getProp_(APP.PROP_INIT_DONE);
  if (done === 'true') {
    return { success:false, error:'Init already completed. Use resetDashboard() to re-init.' };
  }

  // Create spreadsheets
  var core = SpreadsheetApp.create(APP.COMPANY_NAME + ' - COO Dashboard CORE');
  var team = SpreadsheetApp.create(APP.COMPANY_NAME + ' - TEAM');
  var ops  = SpreadsheetApp.create(APP.COMPANY_NAME + ' - OPS');
  var fin  = SpreadsheetApp.create(APP.COMPANY_NAME + ' - FIN');

  setProp_(APP.PROP_CORE_ID, core.getId());
  setProp_(APP.PROP_TEAM_ID, team.getId());
  setProp_(APP.PROP_OPS_ID, ops.getId());
  setProp_(APP.PROP_FIN_ID, fin.getId());

  // Create all tabs
  buildCoreTabs_(core);
  buildTeamTabs_(team);
  buildOpsTabs_(ops);
  buildFinTabs_(fin);

  // Delete default Sheet1 (safe after creating other sheets)
  deleteIfExists_(core, 'Sheet1');
  deleteIfExists_(team, 'Sheet1');
  deleteIfExists_(ops, 'Sheet1');
  deleteIfExists_(fin, 'Sheet1');

  // Seed configuration and demo data
  seedCoreConfig_(core);
  seedDemoData_(team, ops, fin);

  setProp_(APP.PROP_INIT_DONE, 'true');
  return {
    success:true,
    core_id: core.getId(),
    team_id: team.getId(),
    ops_id: ops.getId(),
    fin_id: fin.getId()
  };
}

function resetDashboard() {
  delProp_(APP.PROP_INIT_DONE);
  delProp_(APP.PROP_CORE_ID);
  delProp_(APP.PROP_TEAM_ID);
  delProp_(APP.PROP_OPS_ID);
  delProp_(APP.PROP_FIN_ID);
  delProp_(APP.PROP_SALT);
  return { success:true };
}

function deleteIfExists_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh && ss.getSheets().length > 1) ss.deleteSheet(sh);
}

/* ==================== CORE TABS ==================== */

function buildCoreTabs_(ss) {
  ensureTab_(ss, APP.CORE_TABS.USERS, ['email','name','password_hash','access_role','status']);
  ensureTab_(ss, APP.CORE_TABS.ROLES, ['role_id','display_name','description','order','status']);
  ensureTab_(ss, APP.CORE_TABS.CATEGORIES, ['category_id','parent_category_id','display_name','icon','order','status']);
  ensureTab_(ss, APP.CORE_TABS.PAGES, ['page_id','category_id','display_name','sheet_group','tab_name','view_type','chart_type','x_axis','y_axis','group_by','order','status']);
  ensureTab_(ss, APP.CORE_TABS.PERMISSIONS, ['role_id','page_id','can_view','can_edit','can_export','status']);
}

/* ==================== TEAM TABS ==================== */

function buildTeamTabs_(ss) {
  // Core team data
  ensureTab_(ss, 'people_directory', [
    'employee_id','email','full_name','department','role','position_id','is_manager',
    'employment_type','weekly_target_hours','status','availability_status',
    'manager_employee_id','backup_employee_id',
    'location','birthday','phone','start_date'
  ]);

  ensureTab_(ss, 'leave_log', ['employee_id','start_date','end_date','leave_type','status','leave_days','notes']);
  ensureTab_(ss, 'hours_log_daily', ['date','employee_id','hours_worked','source','notes']);
  ensureTab_(ss, 'positions', ['position_id','position_name','department','role','target_headcount','target_hours_per_person','status']);
  ensureTab_(ss, 'open_positions', ['open_position_id','position_id','headcount_needed','priority','hiring_stage','target_start_date','salary_min','salary_max','currency','responsibilities','job_ad_link','status']);
  ensureTab_(ss, 'staffing_health', ['position_id','target_headcount','actual_headcount','open_roles','headcount_gap','hours_capacity_2w','hours_worked_2w','utilization','status','hiring_in_progress','notes']);
  ensureTab_(ss, 'calc_staffing', ['employee_id','position_id','department','status','hours_capacity_2w','hours_worked_2w']);

  // Department-specific Matrix and KPIs tabs (7 departments × 2 = 14 tabs)
  var depts = ['cs', 'disputes', 'funnel', 'creative', 'media_buyer', 'fb_ads', 'ops'];
  for (var i = 0; i < depts.length; i++) {
    ensureTab_(ss, depts[i] + '_matrix', ['employee_id','full_name','primary_tasks','backup_employee_id','backup_name','availability_status','notes']);
    ensureTab_(ss, depts[i] + '_kpis', ['date','employee_id','full_name','kpi_name','value','target_value','status','notes']);
  }

  // HR tabs
  ensureTab_(ss, 'hr_employee_database', ['employee_id','full_name','department','role','salary','currency','leave_quota_days','leave_used_days','leave_remaining_days','status','notes']);
  ensureTab_(ss, 'hr_warnings', ['date','employee_id','full_name','warning_type','details','issued_by','status']);
  ensureTab_(ss, 'hr_matrix', ['employee_id','full_name','primary_tasks','backup_employee_id','backup_name','availability_status','notes']);
  ensureTab_(ss, 'hr_kpis', ['date','employee_id','full_name','kpi_name','value','target_value','status','notes']);
}

/* ==================== OPS TABS ==================== */

function buildOpsTabs_(ss) {
  ensureTab_(ss, 'projects', ['project_id','project_name','owner','department','status','priority','start_date','due_date','completion_pct','budget','notes']);
  ensureTab_(ss, 'critical_alerts', ['alert_id','alert_type','severity','description','status','created_date','resolved_date','assigned_to']);
  ensureTab_(ss, 'payment_processors', ['processor_name','status','monthly_volume','fees_pct','last_payout_date','notes']);
  ensureTab_(ss, 'company_setup', ['setting_key','setting_value','category','last_updated','notes']);
}

/* ==================== FIN TABS ==================== */

function buildFinTabs_(ss) {
  ensureTab_(ss, 'pnl', ['date','revenue','cogs','gross_profit','marketing','operations','other_expenses','net_profit','notes']);
  ensureTab_(ss, 'product_pnl', ['date','product_name','revenue','cogs','gross_profit','marketing','net_profit','notes']);
  ensureTab_(ss, 'expenses', ['date','category','subcategory','amount','currency','vendor','description','status']);
}

/* ==================== SEED CORE CONFIG ==================== */

function seedCoreConfig_(core) {
  // Roles
  var roles = [
    ['owner','Owner','Full access to everything',1,'Active'],
    ['manager','Manager','Access to department data',2,'Active'],
    ['employee','Employee','Access to own data',3,'Active'],
    ['hr','HR','Access to HR data',4,'Active'],
    ['finance','Finance','Access to finance data',5,'Active'],
    ['operations','Operations','Access to operations data',6,'Active']
  ];
  appendRows_(sheetByName_(core, APP.CORE_TABS.ROLES), roles);

  // Categories (tree structure)
  var cats = [
    ['team','','Team','👥',1,'Active'],
    ['team_cs','team','Customer Service','💬',1,'Active'],
    ['team_disputes','team_cs','Dispute Managers','⚖️',2,'Active'],
    ['team_funnel','team','Funnel Building','🚀',3,'Active'],
    ['team_creative','team','Creatives','🎨',4,'Active'],
    ['team_media','team','Media Buying','💰',5,'Active'],
    ['team_fb','team','FB Ads','📱',6,'Active'],
    ['team_ops','team','Operations','⚙️',7,'Active'],
    ['team_hr','team','HR','👔',8,'Active'],
    ['hr','','HR','👔',2,'Active'],
    ['ops','','Operations','📊',3,'Active'],
    ['fin','','Finances','💵',4,'Active']
  ];
  appendRows_(sheetByName_(core, APP.CORE_TABS.CATEGORIES), cats);

  // Pages
  var pages = [
    // Team - Core
    ['people_dir','team','People Directory',APP.GROUPS.TEAM,'people_directory','table','','','','',1,'Active'],
    ['leave_log','team','Leave Log',APP.GROUPS.TEAM,'leave_log','table','','','','',2,'Active'],
    ['hours_log','team','Hours Log',APP.GROUPS.TEAM,'hours_log_daily','table','','','','',3,'Active'],
    ['open_pos','team','Open Positions',APP.GROUPS.TEAM,'open_positions','kanban','','','','hiring_stage',4,'Active'],
    ['staffing','team','Staffing Health',APP.GROUPS.TEAM,'staffing_health','table','','','','',5,'Active'],
    ['team_calendar','team','Team Calendar',APP.GROUPS.TEAM,'leave_log','calendar','','start_date','end_date','employee_id',6,'Active'],

    // CS Department
    ['cs_matrix','team_cs','CS Matrix',APP.GROUPS.TEAM,'cs_matrix','matrix','','','','',1,'Active'],
    ['cs_kpis_table','team_cs_csr','CS KPIs',APP.GROUPS.TEAM,'cs_kpis','table','','','','',2,'Active'],
    ['cs_kpis_chart','team_cs_csr','CS Trends',APP.GROUPS.TEAM,'cs_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Disputes
    ['disputes_matrix','team_disputes','Disputes Matrix',APP.GROUPS.TEAM,'disputes_matrix','matrix','','','','',1,'Active'],
    ['disputes_kpis_table','team_disputes','Disputes KPIs',APP.GROUPS.TEAM,'disputes_kpis','table','','','','',2,'Active'],
    ['disputes_kpis_chart','team_disputes','Disputes Trends',APP.GROUPS.TEAM,'disputes_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Funnel
    ['funnel_matrix','team_funnel','Funnel Matrix',APP.GROUPS.TEAM,'funnel_matrix','matrix','','','','',1,'Active'],
    ['funnel_kpis_table','team_funnel','Funnel KPIs',APP.GROUPS.TEAM,'funnel_kpis','table','','','','',2,'Active'],
    ['funnel_kpis_chart','team_funnel','Funnel Trends',APP.GROUPS.TEAM,'funnel_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Creative
    ['creative_matrix','team_creative','Creative Matrix',APP.GROUPS.TEAM,'creative_matrix','matrix','','','','',1,'Active'],
    ['creative_kpis_table','team_creative','Creative KPIs',APP.GROUPS.TEAM,'creative_kpis','table','','','','',2,'Active'],
    ['creative_kpis_chart','team_creative','Creative Trends',APP.GROUPS.TEAM,'creative_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Media Buying
    ['media_matrix','team_media','Media Buyer Matrix',APP.GROUPS.TEAM,'media_buyer_matrix','matrix','','','','',1,'Active'],
    ['media_kpis_table','team_media','Media KPIs',APP.GROUPS.TEAM,'media_buyer_kpis','table','','','','',2,'Active'],
    ['media_kpis_chart','team_media','Media Trends',APP.GROUPS.TEAM,'media_buyer_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // FB Ads
    ['fb_matrix','team_fb','FB Ads Matrix',APP.GROUPS.TEAM,'fb_ads_matrix','matrix','','','','',1,'Active'],
    ['fb_kpis_table','team_fb','FB Ads KPIs',APP.GROUPS.TEAM,'fb_ads_kpis','table','','','','',2,'Active'],
    ['fb_kpis_chart','team_fb','FB Ads Trends',APP.GROUPS.TEAM,'fb_ads_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Operations Team
    ['ops_team_matrix','team_ops','Ops Matrix',APP.GROUPS.TEAM,'ops_matrix','matrix','','','','',1,'Active'],
    ['ops_team_kpis_table','team_ops','Ops KPIs',APP.GROUPS.TEAM,'ops_kpis','table','','','','',2,'Active'],
    ['ops_team_kpis_chart','team_ops','Ops Trends',APP.GROUPS.TEAM,'ops_kpis','chart','line','date','value','kpi_name',3,'Active'],

    // Team -> HR (summary KPI views)
    ['team_hr_kpis','team_hr','HR KPI',APP.GROUPS.HR,'hr_kpis','table','','','','',1,'Active'],
    ['team_hr_kpi_metrics','team_hr','KPI Metrics',APP.GROUPS.HR,'hr_kpis','table','','','','',2,'Active'],

    // HR Pages
    ['hr_db','hr','Employee Database',APP.GROUPS.HR,'hr_employee_database','table','','','','',1,'Active'],
    ['hr_warn','hr','Warnings',APP.GROUPS.HR,'hr_warnings','table','','','','',2,'Active'],
    ['hr_leave_requests','hr','Leave Requests',APP.GROUPS.HR,'leave_log','table','','','','',3,'Active'],
    ['hr_leave_tracker','hr','Leave Tracker',APP.GROUPS.HR,'leave_log','table','','','','',4,'Active'],
    ['hr_open_positions','hr','Open Positions',APP.GROUPS.HR,'open_positions','kanban','','','','hiring_stage',5,'Active'],
    ['hr_staff_utilization','hr','Staff Utilization',APP.GROUPS.HR,'staffing_health','table','','','','',6,'Active'],
    ['hr_matrix','hr','HR Matrix',APP.GROUPS.HR,'hr_matrix','matrix','','','','',7,'Active'],
    ['hr_kpis','hr','HR KPIs',APP.GROUPS.HR,'hr_kpis','table','','','','',8,'Active'],
    ['hr_invite','hr','Invite User',APP.GROUPS.HR,'','custom','','','','',99,'Active'],

    // Operations Pages
    ['ops_projects_table','ops','Projects',APP.GROUPS.OPS,'projects','table','','','','',1,'Active'],
    ['ops_projects_kanban','ops','Projects Board',APP.GROUPS.OPS,'projects','kanban','','','','status',2,'Active'],
    ['ops_alerts','ops','Critical Alerts',APP.GROUPS.OPS,'critical_alerts','table','','','','',3,'Active'],
    ['ops_processors','ops','Payment Processors',APP.GROUPS.OPS,'payment_processors','table','','','','',4,'Active'],
    ['ops_setup','ops','Company Setup',APP.GROUPS.OPS,'company_setup','table','','','','',5,'Active'],

    // Finance Pages
    ['fin_pnl_table','fin','P&L',APP.GROUPS.FIN,'pnl','table','','','','',1,'Active'],
    ['fin_pnl_chart','fin','P&L Trends',APP.GROUPS.FIN,'pnl','chart','line','date','net_profit','',2,'Active'],
    ['fin_product','fin','Product P&L',APP.GROUPS.FIN,'product_pnl','table','','','','',3,'Active'],
    ['fin_expenses','fin','Expenses',APP.GROUPS.FIN,'expenses','table','','','','',4,'Active']
  ];
  appendRows_(sheetByName_(core, APP.CORE_TABS.PAGES), pages);

  // Permissions
  var perms = [];
  function allow(role, pageId) { perms.push([role, pageId, true, false, true, 'Active']); }
  
  // Owner sees everything
  for (var i = 0; i < pages.length; i++) { allow('owner', pages[i][0]); }
  
  // Manager sees team pages for their department (will be filtered in backend)
  var managerPages = [
    'people_dir','leave_log','hours_log','open_pos','staffing','team_calendar',
    'cs_matrix','cs_kpis_table','cs_kpis_chart',
    'disputes_matrix','disputes_kpis_table','disputes_kpis_chart',
    'funnel_matrix','funnel_kpis_table','funnel_kpis_chart',
    'creative_matrix','creative_kpis_table','creative_kpis_chart',
    'media_matrix','media_kpis_table','media_kpis_chart',
    'fb_matrix','fb_kpis_table','fb_kpis_chart',
    'ops_team_matrix','ops_team_kpis_table','ops_team_kpis_chart'
  ];
  managerPages.forEach(function(p){ allow('manager', p); });
  
  // Employee sees same as manager but filtered to own data
  managerPages.forEach(function(p){ allow('employee', p); });
  
  // HR sees HR pages + people directory
  [
    'people_dir',
    'team_hr_kpis',
    'team_hr_kpi_metrics',
    'hr_db',
    'hr_warn',
    'hr_leave_requests',
    'hr_leave_tracker',
    'hr_open_positions',
    'hr_staff_utilization',
    'hr_matrix',
    'hr_kpis',
    'hr_invite'
  ].forEach(function(p){ allow('hr', p); });
  
  // Finance sees finance pages + people directory
  ['people_dir','fin_pnl_table','fin_pnl_chart','fin_product','fin_expenses'].forEach(function(p){ allow('finance', p); });
  
  // Operations sees ops pages + people directory
  ['people_dir','ops_projects_table','ops_projects_kanban','ops_alerts','ops_processors','ops_setup'].forEach(function(p){ allow('operations', p); });
  
  appendRows_(sheetByName_(core, APP.CORE_TABS.PERMISSIONS), perms);

  // Users - demo accounts
  var users = [
    ['carl@demo.com','Carl',hashPassword_('changeme'),'owner','Active'],
    ['cs.manager@demo.com','CS Manager',hashPassword_('demo123'),'manager','Active'],
    ['ops.manager@demo.com','Operations Manager',hashPassword_('demo123'),'manager','Active'],
    ['product.manager@demo.com','Product Manager',hashPassword_('demo123'),'manager','Active'],
    ['creative.strategist@demo.com','Creative Strategist',hashPassword_('demo123'),'manager','Active'],
    ['media.manager@demo.com','Media Buyer Manager',hashPassword_('demo123'),'manager','Active'],
    ['fb.manager@demo.com','FB Ads Manager',hashPassword_('demo123'),'manager','Active'],
    ['hr@demo.com','HR Manager',hashPassword_('demo123'),'hr','Active'],
    ['finance@demo.com','Finance Manager',hashPassword_('demo123'),'finance','Active']
  ];
  appendRows_(sheetByName_(core, APP.CORE_TABS.USERS), users);
}

/* ==================== SEED DEMO DATA ==================== */

function seedDemoData_(team, ops, fin) {
  seedPositions_(team);
  seedPeople_(team);
  seedLeave_(team);
  seedHours_(team);
  seedMatrices_(team);
  seedKPIs_(team);
  seedHR_(team);
  seedOpenPositions_(team);
  seedOpsData_(ops);
  seedFinData_(fin);
}

function seedPositions_(team) {
  var sh = sheetByName_(team, 'positions');
  var rows = [
    ['csr','Customer Service Representative','Customer Service','CSR',4,40,'Active'],
    ['dispute','Dispute Specialist','Customer Service','Dispute Specialist',3,40,'Active'],
    ['funnel','Funnel Builder','Funnel Building','Funnel Builder',4,40,'Active'],
    ['creative','Creative Maker','Creatives','Creative Maker',6,40,'Active'],
    ['media','Media Buyer','Media Buying','Media Buyer',3,40,'Active'],
    ['fb_ads','FB Ads Launcher','FB Ads','FB Ads Launcher',3,40,'Active'],
    ['ops','Operations Specialist','Operations','Operations Specialist',3,40,'Active'],
    ['cs_mgr','CS Manager','Customer Service','CS Manager',1,40,'Active'],
    ['ops_mgr','Operations Manager','Operations','Operations Manager',1,40,'Active'],
    ['product_mgr','Product Manager','Funnel Building','Product Manager',1,40,'Active'],
    ['creative_mgr','Creative Strategist','Creatives','Creative Strategist',1,40,'Active'],
    ['media_mgr','Media Buyer Manager','Media Buying','Media Buyer Manager',1,40,'Active'],
    ['fb_mgr','FB Ads Manager','FB Ads','FB Ads Manager',1,40,'Active']
  ];
  appendRows_(sh, rows);
}

function seedPeople_(team) {
  var sh = sheetByName_(team, 'people_directory');
  var rows = [
    // Owner
    ['E001','carl@demo.com','Carl','Executive','Owner','owner',true,'Full Time',40,'Active','Active','','','Philippines','1990-01-01','+63123456789','2023-01-01'],
    
    // Customer Service Manager + Team (8 total)
    ['E101','cs.manager@demo.com','Sarah Johnson','Customer Service','CS Manager','cs_mgr',true,'Full Time',40,'Active','Active','E001','','USA','1988-03-15','+1-555-0101','2023-02-01'],
    ['E102','csr1@demo.com','Michael Chen','Customer Service','CSR','csr',false,'Full Time',40,'Active','Active','E101','E103','Philippines','1995-06-20','+63123456790','2023-06-15'],
    ['E103','csr2@demo.com','Emily Rodriguez','Customer Service','CSR','csr',false,'Full Time',40,'Active','Active','E101','E104','Philippines','1996-08-10','+63123456791','2023-07-01'],
    ['E104','csr3@demo.com','David Park','Customer Service','CSR','csr',false,'Full Time',40,'Active','Active','E101','E105','Philippines','1994-11-25','+63123456792','2023-08-15'],
    ['E105','csr4@demo.com','Lisa Martinez','Customer Service','CSR','csr',false,'Full Time',40,'Active','Active','E101','E102','Philippines','1997-02-14','+63123456793','2024-01-10'],
    ['E106','dispute1@demo.com','James Wilson','Customer Service','Dispute Specialist','dispute',false,'Full Time',40,'Active','Active','E101','E107','Philippines','1993-09-05','+63123456794','2023-09-01'],
    ['E107','dispute2@demo.com','Amanda Taylor','Customer Service','Dispute Specialist','dispute',false,'Full Time',40,'Active','Active','E101','E108','Philippines','1995-12-18','+63123456795','2023-10-15'],
    ['E108','dispute3@demo.com','Ryan Garcia','Customer Service','Dispute Specialist','dispute',false,'Full Time',40,'Active','Active','E101','E106','Philippines','1996-04-22','+63123456796','2024-02-01'],
    
    // Operations Manager + Team (4 total)
    ['E201','ops.manager@demo.com','Robert Anderson','Operations','Operations Manager','ops_mgr',true,'Full Time',40,'Active','Active','E001','','Philippines','1987-05-30','+63123456797','2023-03-01'],
    ['E202','ops1@demo.com','Jennifer Lee','Operations','Operations Specialist','ops',false,'Full Time',40,'Active','Active','E201','E203','Philippines','1994-07-12','+63123456798','2023-08-01'],
    ['E203','ops2@demo.com','Christopher Brown','Operations','Operations Specialist','ops',false,'Full Time',40,'Active','Active','E201','E204','Philippines','1995-10-08','+63123456799','2023-09-15'],
    ['E204','ops3@demo.com','Michelle Davis','Operations','Operations Specialist','ops',false,'Full Time',40,'Active','Active','E201','E202','Philippines','1996-03-25','+63123456800','2024-01-05'],
    
    // Product Manager + Funnel Builders (5 total)
    ['E301','product.manager@demo.com','Daniel Thompson','Funnel Building','Product Manager','product_mgr',true,'Full Time',40,'Active','Active','E001','','USA','1986-08-17','+1-555-0301','2023-02-15'],
    ['E302','funnel1@demo.com','Jessica White','Funnel Building','Funnel Builder','funnel',false,'Full Time',40,'Active','Active','E301','E303','Philippines','1994-11-30','+63123456801','2023-07-15'],
    ['E303','funnel2@demo.com','Matthew Harris','Funnel Building','Funnel Builder','funnel',false,'Full Time',40,'Active','Active','E301','E304','Philippines','1995-01-22','+63123456802','2023-08-20'],
    ['E304','funnel3@demo.com','Ashley Clark','Funnel Building','Funnel Builder','funnel',false,'Full Time',40,'Active','Active','E301','E305','Philippines','1996-05-14','+63123456803','2023-10-01'],
    ['E305','funnel4@demo.com','Joshua Lewis','Funnel Building','Funnel Builder','funnel',false,'Full Time',40,'Active','Active','E301','E302','Philippines','1997-09-08','+63123456804','2024-01-20'],
    
    // Creative Strategist + Makers (7 total)
    ['E401','creative.strategist@demo.com','Maria Gonzalez','Creatives','Creative Strategist','creative_mgr',true,'Full Time',40,'Active','Active','E001','','Philippines','1985-12-05','+63123456805','2023-02-20'],
    ['E402','creative1@demo.com','Kevin Walker','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E403','Philippines','1994-06-18','+63123456806','2023-07-01'],
    ['E403','creative2@demo.com','Stephanie Hall','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E404','Philippines','1995-08-25','+63123456807','2023-08-10'],
    ['E404','creative3@demo.com','Brandon Young','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E405','Philippines','1996-02-11','+63123456808','2023-09-15'],
    ['E405','creative4@demo.com','Nicole King','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E406','Philippines','1997-04-07','+63123456809','2024-01-15'],
    ['E406','creative5@demo.com','Tyler Wright','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E407','Philippines','1996-10-20','+63123456810','2024-02-10'],
    ['E407','creative6@demo.com','Rachel Scott','Creatives','Creative Maker','creative',false,'Full Time',40,'Active','Active','E401','E402','Philippines','1995-12-28','+63123456811','2024-03-01'],
    
    // Media Buyer Manager + Team (4 total)
    ['E501','media.manager@demo.com','William Torres','Media Buying','Media Buyer Manager','media_mgr',true,'Full Time',40,'Active','Active','E001','','USA','1987-07-22','+1-555-0501','2023-03-15'],
    ['E502','media1@demo.com','Samantha Green','Media Buying','Media Buyer','media',false,'Full Time',40,'Active','Active','E501','E503','Philippines','1994-09-16','+63123456812','2023-08-15'],
    ['E503','media2@demo.com','Justin Baker','Media Buying','Media Buyer','media',false,'Full Time',40,'Active','Active','E501','E504','Philippines','1995-11-09','+63123456813','2023-10-01'],
    ['E504','media3@demo.com','Megan Adams','Media Buying','Media Buyer','media',false,'Full Time',40,'Active','Active','E501','E502','Philippines','1996-01-30','+63123456814','2024-02-15'],
    
    // FB Ads Manager + Team (4 total)
    ['E601','fb.manager@demo.com','Thomas Nelson','FB Ads','FB Ads Manager','fb_mgr',true,'Full Time',40,'Active','Active','E001','','USA','1988-04-12','+1-555-0601','2023-03-20'],
    ['E602','fb1@demo.com','Rebecca Carter','FB Ads','FB Ads Launcher','fb_ads',false,'Full Time',40,'Active','Active','E601','E603','Philippines','1995-07-28','+63123456815','2023-09-01'],
    ['E603','fb2@demo.com','Andrew Mitchell','FB Ads','FB Ads Launcher','fb_ads',false,'Full Time',40,'Active','Active','E601','E604','Philippines','1996-03-19','+63123456816','2023-10-15'],
    ['E604','fb3@demo.com','Laura Perez','FB Ads','FB Ads Launcher','fb_ads',false,'Full Time',40,'Active','Active','E601','E602','Philippines','1997-05-05','+63123456817','2024-01-25'],
    
    // HR Manager (1 total)
    ['E701','hr@demo.com','Patricia Roberts','HR','HR Manager','hr_mgr',true,'Full Time',40,'Active','Active','E001','','Philippines','1985-10-15','+63123456818','2023-02-10'],
    
    // Finance Manager (1 total)
    ['E801','finance@demo.com','Richard Turner','Finance','Finance Manager','finance_mgr',true,'Full Time',40,'Active','Active','E001','','Philippines','1984-06-08','+63123456819','2023-02-05']
  ];
  appendRows_(sh, rows);
}

function seedLeave_(team) {
  var sh = sheetByName_(team, 'leave_log');
  var today = new Date();
  var rows = [
    ['E102',formatDate_(addDays_(today, -30)),formatDate_(addDays_(today, -28)),'Sick Leave','Approved',2,'Flu'],
    ['E104',formatDate_(addDays_(today, -25)),formatDate_(addDays_(today, -23)),'Vacation','Approved',2,'Family visit'],
    ['E202',formatDate_(addDays_(today, -20)),formatDate_(addDays_(today, -18)),'Vacation','Approved',2,'Personal'],
    ['E302',formatDate_(addDays_(today, -15)),formatDate_(addDays_(today, -14)),'Sick Leave','Approved',1,'Medical checkup'],
    ['E402',formatDate_(addDays_(today, -10)),formatDate_(addDays_(today, -6)),'Vacation','Approved',4,'Vacation'],
    ['E105',formatDate_(addDays_(today, 5)),formatDate_(addDays_(today, 7)),'Vacation','Pending',2,'Wedding'],
    ['E203',formatDate_(addDays_(today, 10)),formatDate_(addDays_(today, 12)),'Personal','Pending',2,'Family matter'],
    ['E303',formatDate_(addDays_(today, 15)),formatDate_(addDays_(today, 19)),'Vacation','Pending',4,'Travel'],
    ['E403',formatDate_(addDays_(today, 20)),formatDate_(addDays_(today, 21)),'Sick Leave','Pending',1,'Dental'],
    ['E502',formatDate_(addDays_(today, 25)),formatDate_(addDays_(today, 27)),'Vacation','Pending',2,'Family time']
  ];
  appendRows_(sh, rows);
}

function seedHours_(team) {
  var sh = sheetByName_(team, 'hours_log_daily');
  var today = new Date();
  var rows = [];
  var empIds = ['E102','E103','E104','E105','E106','E107','E108','E202','E203','E204','E302','E303','E304','E305','E402','E403','E404','E405','E406','E407','E502','E503','E504','E602','E603','E604'];
  
  // Last 14 days of hours
  for (var d = 14; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < empIds.length; e++) {
      var hours = 8 + Math.floor(Math.random() * 3); // 8-10 hours
      rows.push([date, empIds[e], hours, 'Tracked', '']);
    }
  }
  appendRows_(sh, rows);
}

function seedMatrices_(team) {
  // CS Matrix
  var csMatrix = sheetByName_(team, 'cs_matrix');
  appendRows_(csMatrix, [
    ['E102','Michael Chen','Handle customer support tickets, email responses','E103','Emily Rodriguez','Active','Primary CS rep'],
    ['E103','Emily Rodriguez','Customer inquiries, order tracking','E104','David Park','Active','Secondary CS rep'],
    ['E104','David Park','Live chat support, phone calls','E105','Lisa Martinez','Active','Phone specialist'],
    ['E105','Lisa Martinez','Email support, ticket escalation','E102','Michael Chen','Active','Email specialist'],
    ['E106','James Wilson','PayPal disputes, chargebacks','E107','Amanda Taylor','Active','PayPal specialist'],
    ['E107','Amanda Taylor','Stripe disputes, refund processing','E108','Ryan Garcia','Active','Stripe specialist'],
    ['E108','Ryan Garcia','High-value disputes, fraud cases','E106','James Wilson','Active','Fraud specialist']
  ]);
  
  // Disputes Matrix
  var disputesMatrix = sheetByName_(team, 'disputes_matrix');
  appendRows_(disputesMatrix, [
    ['E106','James Wilson','PayPal disputes, chargebacks','E107','Amanda Taylor','Active','PayPal specialist'],
    ['E107','Amanda Taylor','Stripe disputes, refund processing','E108','Ryan Garcia','Active','Stripe specialist'],
    ['E108','Ryan Garcia','High-value disputes, fraud cases','E106','James Wilson','Active','Fraud specialist']
  ]);
  
  // Funnel Matrix
  var funnelMatrix = sheetByName_(team, 'funnel_matrix');
  appendRows_(funnelMatrix, [
    ['E302','Jessica White','Landing pages, email sequences','E303','Matthew Harris','Active','Landing page specialist'],
    ['E303','Matthew Harris','Sales funnels, checkout optimization','E304','Ashley Clark','Active','Funnel optimization'],
    ['E304','Ashley Clark','Upsell pages, order bumps','E305','Joshua Lewis','Active','Upsell specialist'],
    ['E305','Joshua Lewis','Thank you pages, follow-up sequences','E302','Jessica White','Active','Follow-up specialist']
  ]);
  
  // Creative Matrix
  var creativeMatrix = sheetByName_(team, 'creative_matrix');
  appendRows_(creativeMatrix, [
    ['E402','Kevin Walker','Video editing, thumbnails','E403','Stephanie Hall','Active','Lead video editor'],
    ['E403','Stephanie Hall','Ad creatives, social media clips','E404','Brandon Young','Active','Ad creative specialist'],
    ['E404','Brandon Young','Product photography, image editing','E405','Nicole King','Active','Photo specialist'],
    ['E405','Nicole King','Graphic design, banners','E406','Tyler Wright','Active','Design specialist'],
    ['E406','Tyler Wright','Motion graphics, animations','E407','Rachel Scott','Active','Motion graphics'],
    ['E407','Rachel Scott','Brand materials, templates','E402','Kevin Walker','Active','Brand specialist']
  ]);
  
  // Media Buyer Matrix
  var mediaMatrix = sheetByName_(team, 'media_buyer_matrix');
  appendRows_(mediaMatrix, [
    ['E502','Samantha Green','Facebook Ads strategy, campaign management','E503','Justin Baker','Active','FB Ads lead'],
    ['E503','Justin Baker','Google Ads, search campaigns','E504','Megan Adams','Active','Google Ads specialist'],
    ['E504','Megan Adams','Analytics, reporting, optimization','E502','Samantha Green','Active','Analytics specialist']
  ]);
  
  // FB Ads Matrix
  var fbMatrix = sheetByName_(team, 'fb_ads_matrix');
  appendRows_(fbMatrix, [
    ['E602','Rebecca Carter','Campaign setup, creative testing','E603','Andrew Mitchell','Active','Campaign setup lead'],
    ['E603','Andrew Mitchell','Ad copywriting, audience research','E604','Laura Perez','Active','Copywriting specialist'],
    ['E604','Laura Perez','A/B testing, performance tracking','E602','Rebecca Carter','Active','Testing specialist']
  ]);
  
  // Ops Matrix
  var opsMatrix = sheetByName_(team, 'ops_matrix');
  appendRows_(opsMatrix, [
    ['E202','Jennifer Lee','Inventory management, supplier coordination','E203','Christopher Brown','Active','Inventory lead'],
    ['E203','Christopher Brown','Order processing, fulfillment tracking','E204','Michelle Davis','Active','Fulfillment lead'],
    ['E204','Michelle Davis','Quality checks, shipping logistics','E202','Jennifer Lee','Active','QA specialist']
  ]);
}

function seedKPIs_(team) {
  var today = new Date();
  
  // CS KPIs - Last 30 days
  var csKpis = sheetByName_(team, 'cs_kpis');
  var csRows = [];
  var csEmps = [
    {id:'E102',name:'Michael Chen',kpis:[{name:'Tickets Resolved',val:25,target:20},{name:'Avg Response Time (min)',val:4,target:5},{name:'CSAT Score',val:95,target:90}]},
    {id:'E103',name:'Emily Rodriguez',kpis:[{name:'Tickets Resolved',val:22,target:20},{name:'Avg Response Time (min)',val:5,target:5},{name:'CSAT Score',val:92,target:90}]},
    {id:'E104',name:'David Park',kpis:[{name:'Tickets Resolved',val:28,target:20},{name:'Avg Response Time (min)',val:3,target:5},{name:'CSAT Score',val:97,target:90}]},
    {id:'E105',name:'Lisa Martinez',kpis:[{name:'Tickets Resolved',val:20,target:20},{name:'Avg Response Time (min)',val:6,target:5},{name:'CSAT Score',val:88,target:90}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < csEmps.length; e++) {
      for (var k = 0; k < csEmps[e].kpis.length; k++) {
        var kpi = csEmps[e].kpis[k];
        var variance = Math.floor(Math.random() * 5) - 2;
        var val = kpi.val + variance;
        var status = val >= kpi.target ? 'On Track' : 'Below Target';
        csRows.push([date, csEmps[e].id, csEmps[e].name, kpi.name, val, kpi.target, status, '']);
      }
    }
  }
  appendRows_(csKpis, csRows);
  
  // Disputes KPIs
  var disputesKpis = sheetByName_(team, 'disputes_kpis');
  var disputeRows = [];
  var disputeEmps = [
    {id:'E106',name:'James Wilson',kpis:[{name:'Disputes Resolved',val:15,target:12},{name:'Win Rate %',val:88,target:85},{name:'Recovery Amount $',val:5000,target:4000}]},
    {id:'E107',name:'Amanda Taylor',kpis:[{name:'Disputes Resolved',val:18,target:12},{name:'Win Rate %',val:92,target:85},{name:'Recovery Amount $',val:6200,target:4000}]},
    {id:'E108',name:'Ryan Garcia',kpis:[{name:'Disputes Resolved',val:12,target:12},{name:'Win Rate %',val:85,target:85},{name:'Recovery Amount $',val:4500,target:4000}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < disputeEmps.length; e++) {
      for (var k = 0; k < disputeEmps[e].kpis.length; k++) {
        var kpi = disputeEmps[e].kpis[k];
        var variance = kpi.name.includes('Amount') ? Math.floor(Math.random() * 1000) - 500 : Math.floor(Math.random() * 5) - 2;
        var val = kpi.val + variance;
        var status = val >= kpi.target ? 'On Track' : 'Below Target';
        disputeRows.push([date, disputeEmps[e].id, disputeEmps[e].name, kpi.name, val, kpi.target, status, '']);
      }
    }
  }
  appendRows_(disputesKpis, disputeRows);
  
  // Funnel KPIs
  var funnelKpis = sheetByName_(team, 'funnel_kpis');
  var funnelRows = [];
  var funnelEmps = [
    {id:'E302',name:'Jessica White',kpis:[{name:'Pages Built',val:5,target:4},{name:'Conversion Rate %',val:3.8,target:3.5},{name:'Page Speed (s)',val:1.8,target:2.0}]},
    {id:'E303',name:'Matthew Harris',kpis:[{name:'Pages Built',val:6,target:4},{name:'Conversion Rate %',val:4.2,target:3.5},{name:'Page Speed (s)',val:1.5,target:2.0}]},
    {id:'E304',name:'Ashley Clark',kpis:[{name:'Pages Built',val:4,target:4},{name:'Conversion Rate %',val:3.6,target:3.5},{name:'Page Speed (s)',val:1.9,target:2.0}]},
    {id:'E305',name:'Joshua Lewis',kpis:[{name:'Pages Built',val:5,target:4},{name:'Conversion Rate %',val:3.9,target:3.5},{name:'Page Speed (s)',val:1.7,target:2.0}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < funnelEmps.length; e++) {
      for (var k = 0; k < funnelEmps[e].kpis.length; k++) {
        var kpi = funnelEmps[e].kpis[k];
        var variance = kpi.name.includes('Pages') ? Math.floor(Math.random() * 3) - 1 : (Math.random() * 0.4) - 0.2;
        var val = kpi.val + variance;
        var status = kpi.name.includes('Speed') ? (val <= kpi.target ? 'On Track' : 'Below Target') : (val >= kpi.target ? 'On Track' : 'Below Target');
        funnelRows.push([date, funnelEmps[e].id, funnelEmps[e].name, kpi.name, val.toFixed(1), kpi.target, status, '']);
      }
    }
  }
  appendRows_(funnelKpis, funnelRows);
  
  // Creative KPIs
  var creativeKpis = sheetByName_(team, 'creative_kpis');
  var creativeRows = [];
  var creativeEmps = [
    {id:'E402',name:'Kevin Walker',kpis:[{name:'Videos Completed',val:10,target:8},{name:'Quality Score (1-10)',val:9,target:8},{name:'Turnaround Time (hrs)',val:36,target:48}]},
    {id:'E403',name:'Stephanie Hall',kpis:[{name:'Videos Completed',val:12,target:8},{name:'Quality Score (1-10)',val:9.5,target:8},{name:'Turnaround Time (hrs)',val:32,target:48}]},
    {id:'E404',name:'Brandon Young',kpis:[{name:'Videos Completed',val:8,target:8},{name:'Quality Score (1-10)',val:8.5,target:8},{name:'Turnaround Time (hrs)',val:40,target:48}]},
    {id:'E405',name:'Nicole King',kpis:[{name:'Videos Completed',val:9,target:8},{name:'Quality Score (1-10)',val:9,target:8},{name:'Turnaround Time (hrs)',val:38,target:48}]},
    {id:'E406',name:'Tyler Wright',kpis:[{name:'Videos Completed',val:11,target:8},{name:'Quality Score (1-10)',val:9.2,target:8},{name:'Turnaround Time (hrs)',val:34,target:48}]},
    {id:'E407',name:'Rachel Scott',kpis:[{name:'Videos Completed',val:7,target:8},{name:'Quality Score (1-10)',val:8.8,target:8},{name:'Turnaround Time (hrs)',val:44,target:48}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < creativeEmps.length; e++) {
      for (var k = 0; k < creativeEmps[e].kpis.length; k++) {
        var kpi = creativeEmps[e].kpis[k];
        var variance = kpi.name.includes('Videos') ? Math.floor(Math.random() * 3) - 1 : (kpi.name.includes('Time') ? Math.floor(Math.random() * 8) - 4 : (Math.random() * 0.6) - 0.3);
        var val = kpi.val + variance;
        var status = kpi.name.includes('Time') ? (val <= kpi.target ? 'On Track' : 'Below Target') : (val >= kpi.target ? 'On Track' : 'Below Target');
        creativeRows.push([date, creativeEmps[e].id, creativeEmps[e].name, kpi.name, val.toFixed(1), kpi.target, status, '']);
      }
    }
  }
  appendRows_(creativeKpis, creativeRows);
  
  // Media Buyer KPIs
  var mediaKpis = sheetByName_(team, 'media_buyer_kpis');
  var mediaRows = [];
  var mediaEmps = [
    {id:'E502',name:'Samantha Green',kpis:[{name:'ROAS',val:4.2,target:3.5},{name:'CTR %',val:2.4,target:2.0},{name:'CPA $',val:42,target:45}]},
    {id:'E503',name:'Justin Baker',kpis:[{name:'ROAS',val:3.8,target:3.5},{name:'CTR %',val:2.1,target:2.0},{name:'CPA $',val:48,target:45}]},
    {id:'E504',name:'Megan Adams',kpis:[{name:'ROAS',val:4.5,target:3.5},{name:'CTR %',val:2.6,target:2.0},{name:'CPA $',val:38,target:45}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < mediaEmps.length; e++) {
      for (var k = 0; k < mediaEmps[e].kpis.length; k++) {
        var kpi = mediaEmps[e].kpis[k];
        var variance = kpi.name.includes('CPA') ? Math.floor(Math.random() * 6) - 3 : (Math.random() * 0.4) - 0.2;
        var val = kpi.val + variance;
        var status = kpi.name.includes('CPA') ? (val <= kpi.target ? 'On Track' : 'Below Target') : (val >= kpi.target ? 'On Track' : 'Below Target');
        mediaRows.push([date, mediaEmps[e].id, mediaEmps[e].name, kpi.name, val.toFixed(1), kpi.target, status, '']);
      }
    }
  }
  appendRows_(mediaKpis, mediaRows);
  
  // FB Ads KPIs
  var fbKpis = sheetByName_(team, 'fb_ads_kpis');
  var fbRows = [];
  var fbEmps = [
    {id:'E602',name:'Rebecca Carter',kpis:[{name:'Campaigns Launched',val:6,target:5},{name:'Setup Error Rate %',val:1.2,target:2.0},{name:'Approval Rate %',val:95,target:90}]},
    {id:'E603',name:'Andrew Mitchell',kpis:[{name:'Campaigns Launched',val:5,target:5},{name:'Setup Error Rate %',val:1.8,target:2.0},{name:'Approval Rate %',val:92,target:90}]},
    {id:'E604',name:'Laura Perez',kpis:[{name:'Campaigns Launched',val:7,target:5},{name:'Setup Error Rate %',val:0.9,target:2.0},{name:'Approval Rate %',val:97,target:90}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < fbEmps.length; e++) {
      for (var k = 0; k < fbEmps[e].kpis.length; k++) {
        var kpi = fbEmps[e].kpis[k];
        var variance = kpi.name.includes('Campaigns') ? Math.floor(Math.random() * 3) - 1 : (Math.random() * 1.0) - 0.5;
        var val = kpi.val + variance;
        var status = kpi.name.includes('Error') ? (val <= kpi.target ? 'On Track' : 'Below Target') : (val >= kpi.target ? 'On Track' : 'Below Target');
        fbRows.push([date, fbEmps[e].id, fbEmps[e].name, kpi.name, val.toFixed(1), kpi.target, status, '']);
      }
    }
  }
  appendRows_(fbKpis, fbRows);
  
  // Ops KPIs
  var opsKpis = sheetByName_(team, 'ops_kpis');
  var opsRows = [];
  var opsEmps = [
    {id:'E202',name:'Jennifer Lee',kpis:[{name:'On-Time Fulfillment %',val:97,target:95},{name:'Inventory Accuracy %',val:99,target:98},{name:'Orders Processed',val:350,target:300}]},
    {id:'E203',name:'Christopher Brown',kpis:[{name:'On-Time Fulfillment %',val:95,target:95},{name:'Inventory Accuracy %',val:98,target:98},{name:'Orders Processed',val:320,target:300}]},
    {id:'E204',name:'Michelle Davis',kpis:[{name:'On-Time Fulfillment %',val:98,target:95},{name:'Inventory Accuracy %',val:99,target:98},{name:'Orders Processed',val:380,target:300}]}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < opsEmps.length; e++) {
      for (var k = 0; k < opsEmps[e].kpis.length; k++) {
        var kpi = opsEmps[e].kpis[k];
        var variance = kpi.name.includes('Orders') ? Math.floor(Math.random() * 40) - 20 : (Math.random() * 3) - 1.5;
        var val = kpi.val + variance;
        var status = val >= kpi.target ? 'On Track' : 'Below Target';
        opsRows.push([date, opsEmps[e].id, opsEmps[e].name, kpi.name, val.toFixed(0), kpi.target, status, '']);
      }
    }
  }
  appendRows_(opsKpis, opsRows);
}

function seedHR_(team) {
  // HR Employee Database
  var hrDb = sheetByName_(team, 'hr_employee_database');
  var hrRows = [
    ['E102','Michael Chen','Customer Service','CSR',45000,'USD',15,3,12,'Active',''],
    ['E103','Emily Rodriguez','Customer Service','CSR',45000,'USD',15,2,13,'Active',''],
    ['E104','David Park','Customer Service','CSR',46000,'USD',15,4,11,'Active',''],
    ['E105','Lisa Martinez','Customer Service','CSR',44000,'USD',15,1,14,'Active',''],
    ['E106','James Wilson','Customer Service','Dispute Specialist',52000,'USD',18,5,13,'Active',''],
    ['E107','Amanda Taylor','Customer Service','Dispute Specialist',53000,'USD',18,3,15,'Active',''],
    ['E108','Ryan Garcia','Customer Service','Dispute Specialist',51000,'USD',18,2,16,'Active',''],
    ['E202','Jennifer Lee','Operations','Operations Specialist',48000,'USD',15,4,11,'Active',''],
    ['E203','Christopher Brown','Operations','Operations Specialist',47000,'USD',15,3,12,'Active',''],
    ['E204','Michelle Davis','Operations','Operations Specialist',46000,'USD',15,1,14,'Active',''],
    ['E302','Jessica White','Funnel Building','Funnel Builder',50000,'USD',18,5,13,'Active',''],
    ['E303','Matthew Harris','Funnel Building','Funnel Builder',51000,'USD',18,4,14,'Active',''],
    ['E304','Ashley Clark','Funnel Building','Funnel Builder',49000,'USD',18,2,16,'Active',''],
    ['E305','Joshua Lewis','Funnel Building','Funnel Builder',48000,'USD',18,1,17,'Active',''],
    ['E402','Kevin Walker','Creatives','Creative Maker',52000,'USD',18,6,12,'Active',''],
    ['E403','Stephanie Hall','Creatives','Creative Maker',53000,'USD',18,4,14,'Active',''],
    ['E404','Brandon Young','Creatives','Creative Maker',50000,'USD',18,3,15,'Active',''],
    ['E405','Nicole King','Creatives','Creative Maker',51000,'USD',18,2,16,'Active',''],
    ['E406','Tyler Wright','Creatives','Creative Maker',49000,'USD',18,1,17,'Active',''],
    ['E407','Rachel Scott','Creatives','Creative Maker',48000,'USD',18,0,18,'Active',''],
    ['E502','Samantha Green','Media Buying','Media Buyer',58000,'USD',20,7,13,'Active',''],
    ['E503','Justin Baker','Media Buying','Media Buyer',57000,'USD',20,5,15,'Active',''],
    ['E504','Megan Adams','Media Buying','Media Buyer',56000,'USD',20,2,18,'Active',''],
    ['E602','Rebecca Carter','FB Ads','FB Ads Launcher',55000,'USD',18,6,12,'Active',''],
    ['E603','Andrew Mitchell','FB Ads','FB Ads Launcher',54000,'USD',18,4,14,'Active',''],
    ['E604','Laura Perez','FB Ads','FB Ads Launcher',53000,'USD',18,1,17,'Active','']
  ];
  appendRows_(hrDb, hrRows);
  
  // HR Warnings
  var hrWarn = sheetByName_(team, 'hr_warnings');
  var today = new Date();
  appendRows_(hrWarn, [
    [formatDate_(addDays_(today, -45)),'E105','Lisa Martinez','Performance','Missed 3 deadlines in January','E101','Resolved'],
    [formatDate_(addDays_(today, -30)),'E204','Michelle Davis','Attendance','Late arrivals (5 times)','E201','Active'],
    [formatDate_(addDays_(today, -20)),'E304','Ashley Clark','Conduct','Inappropriate language with client','E301','Resolved'],
    [formatDate_(addDays_(today, -10)),'E407','Rachel Scott','Performance','Quality issues on 2 videos','E401','Active']
  ]);
  
  // HR Matrix
  var hrMatrix = sheetByName_(team, 'hr_matrix');
  appendRows_(hrMatrix, [
    ['E701','Patricia Roberts','Recruitment, onboarding, employee relations','','','Active','HR lead - no backup currently']
  ]);
  
  // HR KPIs
  var hrKpis = sheetByName_(team, 'hr_kpis');
  var hrKpiRows = [];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    hrKpiRows.push([date,'E701','Patricia Roberts','Time to Hire (days)',18 + Math.floor(Math.random() * 6) - 3,21,'On Track','']);
    hrKpiRows.push([date,'E701','Patricia Roberts','Employee Satisfaction',4.2 + (Math.random() * 0.4) - 0.2,4.0,'On Track','']);
    hrKpiRows.push([date,'E701','Patricia Roberts','Retention Rate %',94 + Math.floor(Math.random() * 4) - 2,92,'On Track','']);
  }
  appendRows_(hrKpis, hrKpiRows);
}

function seedOpenPositions_(team) {
  var sh = sheetByName_(team, 'open_positions');
  var today = new Date();
  appendRows_(sh, [
    ['OP001','csr',1,'High','Screening',formatDate_(addDays_(today, 30)),44000,46000,'USD','Handle customer inquiries and support tickets','https://jobs.demo.com/csr','Active'],
    ['OP002','creative',1,'High','Interview',formatDate_(addDays_(today, 45)),50000,54000,'USD','Create video content and ad creatives','https://jobs.demo.com/creative','Active'],
    ['OP003','dispute',1,'Medium','Interview',formatDate_(addDays_(today, 60)),51000,55000,'USD','Manage payment disputes and chargebacks','https://jobs.demo.com/dispute','Active'],
    ['OP004','funnel',1,'Medium','Screening',formatDate_(addDays_(today, 40)),48000,52000,'USD','Build and optimize sales funnels','https://jobs.demo.com/funnel','Active'],
    ['OP005','media',1,'High','Offer',formatDate_(addDays_(today, 20)),56000,60000,'USD','Manage Facebook and Google Ads campaigns','https://jobs.demo.com/media','Active'],
    ['OP006','ops',1,'Low','Screening',formatDate_(addDays_(today, 90)),46000,49000,'USD','Handle operations and fulfillment','https://jobs.demo.com/ops','Active'],
    ['OP007','fb_ads',1,'Medium','Not Started',formatDate_(addDays_(today, 75)),53000,57000,'USD','Launch and manage Facebook ad campaigns','https://jobs.demo.com/fb_ads','Active'],
    ['OP008','csr',1,'Low','Screening',formatDate_(addDays_(today, 60)),44000,46000,'USD','Part-time customer support','https://jobs.demo.com/csr-pt','Active']
  ]);
}

function seedOpsData_(ops) {
  var today = new Date();
  
  // Projects
  var projects = sheetByName_(ops, 'projects');
  appendRows_(projects, [
    ['PROJ001','Q1 Marketing Campaign','E501','Media Buying','In Progress','High',formatDate_(addDays_(today, -60)),formatDate_(addDays_(today, 30)),65,50000,'Major campaign for new product'],
    ['PROJ002','Website Redesign','E201','Operations','In Progress','High',formatDate_(addDays_(today, -45)),formatDate_(addDays_(today, 15)),80,25000,'Complete site overhaul'],
    ['PROJ003','New Product Launch','E001','Executive','Planning','High',formatDate_(addDays_(today, -30)),formatDate_(addDays_(today, 90)),25,100000,'Launch anti-aging serum v2'],
    ['PROJ004','Video Content Library','E401','Creatives','In Progress','Medium',formatDate_(addDays_(today, -90)),formatDate_(addDays_(today, 60)),50,15000,'Build 100 video library'],
    ['PROJ005','Customer Survey Initiative','E101','Customer Service','In Progress','Medium',formatDate_(addDays_(today, -20)),formatDate_(addDays_(today, 10)),90,5000,'Gather customer feedback'],
    ['PROJ006','HR Training Program','E701','HR','Planning','Low',formatDate_(addDays_(today, -15)),formatDate_(addDays_(today, 45)),10,8000,'Employee development program'],
    ['PROJ007','Inventory System Upgrade','E201','Operations','Not Started','Medium',formatDate_(addDays_(today, 0)),formatDate_(addDays_(today, 60)),0,12000,'New inventory management'],
    ['PROJ008','Email Marketing Automation','E301','Funnel Building','In Progress','High',formatDate_(addDays_(today, -40)),formatDate_(addDays_(today, 20)),70,10000,'Automated email sequences'],
    ['PROJ009','Payment Gateway Integration','E201','Operations','In Progress','High',formatDate_(addDays_(today, -25)),formatDate_(addDays_(today, 5)),85,8000,'Add Stripe checkout'],
    ['PROJ010','Social Media Campaign','E401','Creatives','Planning','Medium',formatDate_(addDays_(today, -10)),formatDate_(addDays_(today, 50)),15,12000,'TikTok and Instagram push'],
    ['PROJ011','Customer Portal','E301','Funnel Building','In Progress','Low',formatDate_(addDays_(today, -35)),formatDate_(addDays_(today, 35)),45,18000,'Self-service customer portal'],
    ['PROJ012','Analytics Dashboard','E801','Finance','Planning','Medium',formatDate_(addDays_(today, -5)),formatDate_(addDays_(today, 40)),5,7000,'Real-time metrics dashboard'],
    ['PROJ013','Supplier Diversification','E201','Operations','In Progress','High',formatDate_(addDays_(today, -50)),formatDate_(addDays_(today, 25)),60,20000,'Find alternate suppliers'],
    ['PROJ014','Brand Refresh','E401','Creatives','Not Started','Low',formatDate_(addDays_(today, 10)),formatDate_(addDays_(today, 100)),0,15000,'Update brand identity'],
    ['PROJ015','Mobile App Development','E301','Funnel Building','Planning','Medium',formatDate_(addDays_(today, -20)),formatDate_(addDays_(today, 120)),20,50000,'iOS and Android apps']
  ]);
  
  // Critical Alerts
  var alerts = sheetByName_(ops, 'critical_alerts');
  appendRows_(alerts, [
    ['ALERT001','Payment Processor','High','Stripe payout delayed by 3 days','Open',formatDate_(addDays_(today, -2)),'','E201'],
    ['ALERT002','Inventory','Critical','Anti-aging serum stock below threshold (50 units)','Open',formatDate_(addDays_(today, -1)),'','E202'],
    ['ALERT003','Customer Service','Medium','Average response time increased to 8 minutes','In Progress',formatDate_(addDays_(today, -5)),formatDate_(addDays_(today, -2)),'E101'],
    ['ALERT004','Marketing','High','Facebook ad account spending limit reached','Resolved',formatDate_(addDays_(today, -3)),formatDate_(addDays_(today, -3)),'E501'],
    ['ALERT005','Operations','Medium','Shipping carrier delays (2-3 day backlog)','In Progress',formatDate_(addDays_(today, -4)),'','E201']
  ]);
  
  // Payment Processors
  var processors = sheetByName_(ops, 'payment_processors');
  appendRows_(processors, [
    ['Stripe','Active',285000,2.9,formatDate_(addDays_(today, -7)),'Primary payment processor'],
    ['PayPal','Active',150000,3.2,formatDate_(addDays_(today, -14)),'Secondary processor'],
    ['Authorize.net','Paused',0,2.5,formatDate_(addDays_(today, -90)),'Backup processor - not in use'],
    ['Shopify Payments','Active',95000,2.7,formatDate_(addDays_(today, -3)),'Shopify store only']
  ]);
  
  // Company Setup
  var setup = sheetByName_(ops, 'company_setup');
  appendRows_(setup, [
    ['company_name','Asteral Global Ltd','General',formatDate_(today),'Legal business name'],
    ['currency','USD','Finance',formatDate_(today),'Primary currency'],
    ['tax_id','12-3456789','Finance',formatDate_(today),'EIN for US operations'],
    ['default_shipping','USPS Priority','Operations',formatDate_(addDays_(today, -30)),'Standard shipping method'],
    ['support_email','support@asteral.com','Customer Service',formatDate_(today),'Main support contact'],
    ['office_location','Manila, Philippines','General',formatDate_(today),'Primary office'],
    ['fiscal_year_start','2025-01-01','Finance',formatDate_(today),'Fiscal year begins January 1'],
    ['overtime_threshold','40','HR',formatDate_(today),'Weekly hours before overtime']
  ]);
}

function seedFinData_(fin) {
  var today = new Date();
  
  // P&L - Last 30 days
  var pnl = sheetByName_(fin, 'pnl');
  var pnlRows = [];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    var revenue = 45000 + Math.floor(Math.random() * 10000);
    var cogs = Math.floor(revenue * 0.35);
    var grossProfit = revenue - cogs;
    var marketing = Math.floor(revenue * 0.25);
    var operations = 8000 + Math.floor(Math.random() * 2000);
    var other = 2000 + Math.floor(Math.random() * 1000);
    var netProfit = grossProfit - marketing - operations - other;
    pnlRows.push([date, revenue, cogs, grossProfit, marketing, operations, other, netProfit, '']);
  }
  appendRows_(pnl, pnlRows);
  
  // Product P&L
  var productPnl = sheetByName_(fin, 'product_pnl');
  var productRows = [];
  var products = [
    {name:'Anti-Aging Serum', revMin:30000, revMax:40000},
    {name:'Night Cream', revMin:8000, revMax:12000},
    {name:'Eye Cream', revMin:5000, revMax:8000}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var p = 0; p < products.length; p++) {
      var revenue = products[p].revMin + Math.floor(Math.random() * (products[p].revMax - products[p].revMin));
      var cogs = Math.floor(revenue * 0.35);
      var grossProfit = revenue - cogs;
      var marketing = Math.floor(revenue * 0.28);
      var netProfit = grossProfit - marketing;
      productRows.push([date, products[p].name, revenue, cogs, grossProfit, marketing, netProfit, '']);
    }
  }
  appendRows_(productPnl, productRows);
  
  // Expenses
  var expenses = sheetByName_(fin, 'expenses');
  var expenseRows = [];
  var expenseCategories = [
    {cat:'Marketing',sub:'Facebook Ads',min:8000,max:12000},
    {cat:'Marketing',sub:'Google Ads',min:3000,max:5000},
    {cat:'Operations',sub:'Shipping',min:5000,max:7000},
    {cat:'Operations',sub:'Warehouse',min:2000,max:3000},
    {cat:'Salaries',sub:'Team Payroll',min:50000,max:55000},
    {cat:'Software',sub:'Subscriptions',min:1500,max:2500},
    {cat:'Office',sub:'Rent & Utilities',min:3000,max:4000}
  ];
  for (var d = 30; d >= 1; d--) {
    var date = formatDate_(addDays_(today, -d));
    for (var e = 0; e < expenseCategories.length; e++) {
      var exp = expenseCategories[e];
      var amount = exp.min + Math.floor(Math.random() * (exp.max - exp.min));
      expenseRows.push([date, exp.cat, exp.sub, amount, 'USD', 'Various', exp.sub + ' expenses', 'Paid']);
    }
  }
  appendRows_(expenses, expenseRows);
}

/* ==================== HELPER FUNCTIONS ==================== */

function formatDate_(date) {
  return Utilities.formatDate(date, 'Etc/UTC', 'yyyy-MM-dd');
}

function addDays_(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
