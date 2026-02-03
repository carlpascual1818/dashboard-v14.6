/** constants.gs
 * Global constants, sheet names, property keys
 */

var APP = {
  COMPANY_NAME: 'Asteral Global Ltd',
  COMPANY_ID: 'ASTERAL',
  VERSION: 'v5-department-specific',
  PROP_CORE_ID: 'CORE_SHEET_ID',
  PROP_TEAM_ID: 'TEAM_SHEET_ID',
  PROP_OPS_ID: 'OPS_SHEET_ID',
  PROP_FIN_ID: 'FIN_SHEET_ID',
  PROP_ROOT_FOLDER_ID: 'ROOT_FOLDER_ID',
  PROP_INIT_DONE: 'INIT_DONE',
  PROP_LAST_AUTH_EMAIL: 'LAST_AUTH_EMAIL',
  PROP_WEB_APP_URL: 'WEB_APP_URL',
  PROP_SALT: 'AUTH_SALT',
  TOKEN_TTL_HOURS: 168, // 7 days
  CACHE_TTL_SEC: 300,  // 5 minutes
  
  // Core tabs
  CORE_TABS: {
    USERS: 'Users',
    ROLES: 'Config_Roles',
    CATEGORIES: 'Config_Categories',
    PAGES: 'Config_Pages',
    PERMISSIONS: 'Config_Permissions',
    INVITES: 'Invites'
  },
  
  // Data sheet groups
  GROUPS: {
    TEAM: 'TEAM',
    OPS: 'OPS',
    FIN: 'FIN',
    HR: 'HR'
  },
  
  // Departments
  DEPARTMENTS: {
    CUSTOMER_SERVICE: 'Customer Service',
    OPERATIONS: 'Operations',
    FUNNEL_BUILDING: 'Funnel Building',
    CREATIVES: 'Creatives',
    MEDIA_BUYING: 'Media Buying',
    FB_ADS: 'FB Ads',
    HR: 'HR',
    FINANCE: 'Finance',
    EXECUTIVE: 'Executive'
  }
};
