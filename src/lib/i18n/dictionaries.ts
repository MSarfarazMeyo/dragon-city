export type Locale = "en" | "zh" | "ar";

export type Dictionary = {
  nav: {
    map: string;
    merchants: string;
    invoices: string;
    tickets: string;
    dashboards: string;
    staff: string;
    leads: string;
    settings: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    logOut: string;
    all: string;
    reset: string;
    close: string;
    confirm: string;
    language: string;
    pageOf: string;
    previous: string;
    next: string;
  };
  auth: {
    brand: string;
    welcomeBack: string;
    subtitle: string;
    emailLabel: string;
    passwordLabel: string;
    showPassword: string;
    hidePassword: string;
    signIn: string;
    signingIn: string;
    deactivated: string;
    footerHint: string;
    locationLine: string;
  };
  map: {
    title: string;
    subtitle: string;
    planView: string;
    gridView: string;
    planViewHint: string;
    gridViewHint: string;
    referencePlan: string;
    referencePlanDesc: string;
    openInNewTab: string;
    noShops: string;
    addShopHint: string;
    total: string;
    zone: string;
    filterByStatus: string;
    linkedUnits: string;
    noFloorPlan: string;
  };
  merchants: {
    title: string;
    subtitle: string;
    addMerchant: string;
    exportCsv: string;
    importCsv: string;
    statTotal: string;
    statCompanies: string;
    statIndividuals: string;
    statActiveShops: string;
    statLogins: string;
    searchPlaceholder: string;
    typeAll: string;
    typeIndividual: string;
    typeCompany: string;
    colName: string;
    colType: string;
    colContact: string;
    colActiveShops: string;
    none: string;
    more: string;
    showing: string;
    noMatchFilters: string;
    emptyPrefix: string;
    emptySuffix: string;
    noMatchFiltersLong: string;
    addDialogTitle: string;
    addDialogDesc: string;
    fieldName: string;
    fieldType: string;
    fieldCrNumber: string;
    fieldContactName: string;
    fieldPhone: string;
    fieldEmail: string;
    fieldNotes: string;
    optional: string;
    save: string;
    saving: string;
    importDialogTitle: string;
    importDialogDesc: string;
    csvFile: string;
    import: string;
    importing: string;
    imported: string;
    backLink: string;
    tabOverview: string;
    tabShops: string;
    tabInvoices: string;
    tabTickets: string;
    tabDocuments: string;
    tabAccount: string;
    statOutstanding: string;
    statOpenTickets: string;
    statLogin: string;
    loginActive: string;
    loginNone: string;
    infoContact: string;
    infoPhone: string;
    infoEmail: string;
    infoCrNumber: string;
    activeShopsHeading: string;
    assignShop: string;
    noActiveShops: string;
    colUnit: string;
    colPeriod: string;
    colRent: string;
    open: string;
    endLease: string;
    ending: string;
    leaseHistoryHeading: string;
    colStatus: string;
    noInvoicesYet: string;
    colDue: string;
    colTotal: string;
    colBalance: string;
    invoiceOverdue: string;
    invoicePaid: string;
    invoicePending: string;
    noTicketsFromMerchant: string;
    colTicketType: string;
    colShop: string;
    colDepartment: string;
    colOpened: string;
    noDocuments: string;
    uploadDocument: string;
    assignDialogTitle: string;
    assignDialogDesc: string;
    shopLabel: string;
    startDate: string;
    endDate: string;
    rent: string;
    deposit: string;
    serviceFee: string;
    billingStatus: string;
    billingActive: string;
    billingFitOut: string;
    billingFreeUse: string;
    assign: string;
    assigning: string;
    loginTitle: string;
    noLoginDesc: string;
    emailLabel: string;
    passwordLabel: string;
    passwordHint: string;
    createAccount: string;
    creatingAccount: string;
    hasLoginDesc: string;
    resetPassword: string;
    newPasswordLabel: string;
    saveNewPassword: string;
    cancel: string;
  };
  finance: {
    title: string;
    invoices: string;
    overdue: string;
    pending: string;
    paid: string;
  };
  tickets: {
    title: string;
    subtitle: string;
    newTicket: string;
    statOpen: string;
    statInProgress: string;
    statResolved: string;
    statArchived: string;
    searchPlaceholder: string;
    filterStatusLabel: string;
    filterAllStatuses: string;
    filterDepartmentLabel: string;
    filterAllDepartments: string;
    deptOperations: string;
    deptFinance: string;
    deptMaintenance: string;
    reset: string;
    noMatchFilters: string;
    noMatchFiltersLong: string;
    showing: string;
    noShop: string;
    noMerchant: string;
    colTicket: string;
    colShop: string;
    colMerchant: string;
    colDept: string;
    colStatus: string;
    colCreated: string;
    rowsPerPage: string;
    pageOf: string;
    previousPage: string;
    nextPage: string;
    createDialogTitle: string;
    createDialogDesc: string;
    fieldDepartment: string;
    fieldType: string;
    typePlaceholder: string;
    fieldShop: string;
    none: string;
    fieldMerchant: string;
    fieldDescription: string;
    descPlaceholder: string;
    create: string;
    creating: string;
    detailShop: string;
    detailMerchant: string;
    detailCreatedBy: string;
    notLinked: string;
    unknown: string;
    description: string;
    noDescription: string;
    timeline: string;
    created: string;
    resolved: string;
    archived: string;
    activity: string;
    noActivity: string;
    createdThisTicket: string;
    madeChange: string;
    changed: string;
    system: string;
    start: string;
    resolve: string;
    reopenTicket: string;
    archive: string;
    restore: string;
    deletePermanently: string;
    deleteConfirm: string;
    opened: string;
    minutesAgo: string;
    hoursAgo: string;
  };
  portal: {
    title: string;
    welcome: string;
    myLease: string;
    myInvoices: string;
  };
  leasing: {
    title: string;
    leads: string;
    followUp: string;
    converted: string;
  };
  admin: {
    title: string;
    settings: string;
    users: string;
    system: string;
  };
  statuses: {
    free: string;
    occupied: string;
    expiring: string;
    fit_out: string;
    on_hold: string;
    overdue: string;
    normal: string;
    inventory: string;
    absconded: string;
    moved_out: string;
    showroom: string;
    holding: string;
    follow_up: string;
    unknown: string;
    empty: string;
  };
};

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    nav: {
      map: "Map",
      merchants: "Merchants",
      invoices: "Invoices",
      tickets: "Tickets",
      dashboards: "Dashboards",
      staff: "Staff",
      leads: "Leads",
      settings: "Settings",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      loading: "Loading…",
      logOut: "Log out",
      all: "All",
      reset: "Reset",
      close: "Close",
      confirm: "Confirm",
      language: "Language",
      pageOf: "Page {{page}} of {{total}}",
      previous: "Previous",
      next: "Next",
    },
    auth: {
      brand: "Dragon City",
      welcomeBack: "Welcome back",
      subtitle: "Sign in to manage shops, finance, and requests.",
      emailLabel: "Email",
      passwordLabel: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      signIn: "Sign in",
      signingIn: "Signing in…",
      deactivated: "This account has been deactivated. Contact an admin.",
      footerHint: "Accounts are provisioned by an admin — contact yours if you need access.",
      locationLine: "Riyadh, Saudi Arabia · Internal use only",
    },
    map: {
      title: "Map",
      subtitle: "Interactive floor plan and zone grid for shop occupancy.",
      planView: "Map view",
      gridView: "List view",
      planViewHint: "Showing the interactive map — click any shop to see its details. Switch to List view for a simple table of every shop instead.",
      gridViewHint: "Showing every shop as a simple table. Switch to Map view to see them laid out on the map instead.",
      referencePlan: "Reference plan",
      referencePlanDesc: "For reference only — the live map is maintained separately.",
      openInNewTab: "Open in new tab",
      noShops: "No shops yet.",
      addShopHint: "Add shop",
      total: "Total",
      zone: "Zone",
      filterByStatus: "Filter by status",
      linkedUnits: "Linked units",
      noFloorPlan: "No floor plan image for this level.",
    },
    merchants: {
      title: "Merchants",
      subtitle: "Merchant records — link a shop from the map to create a lease.",
      addMerchant: "Add merchant",
      exportCsv: "Export CSV",
      importCsv: "Import CSV",
      statTotal: "Total merchants",
      statCompanies: "Companies",
      statIndividuals: "Individuals",
      statActiveShops: "Active shops",
      statLogins: "{{n}} logins",
      searchPlaceholder: "Search by name or phone…",
      typeAll: "All types",
      typeIndividual: "Individual",
      typeCompany: "Company",
      colName: "Name",
      colType: "Type",
      colContact: "Contact",
      colActiveShops: "Active shops",
      none: "None",
      more: "+{{n}} more",
      showing: "Showing {{from}}–{{to}} of {{count}} merchants",
      noMatchFilters: "No merchants match these filters",
      emptyPrefix: "No merchants yet. Click",
      emptySuffix: "to start.",
      noMatchFiltersLong: "No merchants match your filters.",
      addDialogTitle: "Add a merchant",
      addDialogDesc: "Create the merchant record — link it to a shop from the map.",
      fieldName: "Name",
      fieldType: "Type",
      fieldCrNumber: "CR number",
      fieldContactName: "Contact name",
      fieldPhone: "Phone",
      fieldEmail: "Email",
      fieldNotes: "Notes",
      optional: "Optional",
      save: "Save",
      saving: "Saving…",
      importDialogTitle: "Import merchants",
      importDialogDesc: "CSV columns: name, type (individual/company), phone. Header row optional.",
      csvFile: "CSV file",
      import: "Import",
      importing: "Importing…",
      imported: "Imported {{n}} merchant(s).",
      backLink: "← Merchants",
      tabOverview: "Overview",
      tabShops: "Shops",
      tabInvoices: "Invoices",
      tabTickets: "Tickets",
      tabDocuments: "Documents",
      tabAccount: "Account",
      statOutstanding: "Outstanding",
      statOpenTickets: "Open tickets",
      statLogin: "Login",
      loginActive: "Active",
      loginNone: "None",
      infoContact: "Contact",
      infoPhone: "Phone",
      infoEmail: "Email",
      infoCrNumber: "CR number",
      activeShopsHeading: "Active shops",
      assignShop: "Assign a shop",
      noActiveShops: "No active shops. Assign one to get started.",
      colUnit: "Unit",
      colPeriod: "Period",
      colRent: "Rent",
      open: "open",
      endLease: "End lease",
      ending: "Ending…",
      leaseHistoryHeading: "Lease history",
      colStatus: "Status",
      noInvoicesYet: "No invoices yet.",
      colDue: "Due",
      colTotal: "Total",
      colBalance: "Balance",
      invoiceOverdue: "Overdue",
      invoicePaid: "Paid",
      invoicePending: "Pending",
      noTicketsFromMerchant: "No tickets from this merchant.",
      colTicketType: "Type",
      colShop: "Shop",
      colDepartment: "Department",
      colOpened: "Opened",
      noDocuments: "No documents on file.",
      uploadDocument: "Upload document",
      assignDialogTitle: "Assign a shop to this merchant",
      assignDialogDesc: "Only shops with no active lease are listed.",
      shopLabel: "Shop",
      startDate: "Start date",
      endDate: "End date",
      rent: "Rent",
      deposit: "Deposit",
      serviceFee: "Service fee",
      billingStatus: "Billing status",
      billingActive: "Active (billed normally)",
      billingFitOut: "Fit-out (not yet open)",
      billingFreeUse: "Free use (occupied, unbilled)",
      assign: "Assign shop",
      assigning: "Saving…",
      loginTitle: "Merchant login",
      noLoginDesc: "This merchant has no portal login yet. Create one and share the password directly — there's no invite email.",
      emailLabel: "Email",
      passwordLabel: "Password",
      passwordHint: "At least 8 characters",
      createAccount: "Create account",
      creatingAccount: "Creating…",
      hasLoginDesc: "This merchant can sign in to the portal with the email below.",
      resetPassword: "Reset password",
      newPasswordLabel: "New password",
      saveNewPassword: "Save new password",
      cancel: "Cancel",
    },
    finance: {
      title: "Finance",
      invoices: "Invoices",
      overdue: "Overdue",
      pending: "Pending",
      paid: "Paid",
    },
    tickets: {
      title: "Tickets",
      subtitle: "Department-routed work queue — click any ticket for full detail and actions.",
      newTicket: "New ticket",
      statOpen: "Open",
      statInProgress: "In progress",
      statResolved: "Resolved",
      statArchived: "Archived",
      searchPlaceholder: "Search type, shop, merchant…",
      filterStatusLabel: "Status",
      filterAllStatuses: "All statuses",
      filterDepartmentLabel: "Department",
      filterAllDepartments: "All departments",
      deptOperations: "Operations",
      deptFinance: "Finance",
      deptMaintenance: "Maintenance",
      reset: "Reset",
      noMatchFilters: "No tickets match these filters",
      noMatchFiltersLong: "No tickets match these filters.",
      showing: "Showing {{from}}–{{to}} of {{count}} tickets",
      noShop: "No shop",
      noMerchant: "No merchant",
      colTicket: "Ticket",
      colShop: "Shop",
      colMerchant: "Merchant",
      colDept: "Dept",
      colStatus: "Status",
      colCreated: "Created",
      rowsPerPage: "Rows per page",
      pageOf: "Page {{page}} of {{total}}",
      previousPage: "Previous page",
      nextPage: "Next page",
      createDialogTitle: "New ticket",
      createDialogDesc: "Routes to the department that owns it — nobody else sees it by default.",
      fieldDepartment: "Department",
      fieldType: "Type",
      typePlaceholder: "Repair request, complaint…",
      fieldShop: "Shop",
      none: "None",
      fieldMerchant: "Merchant",
      fieldDescription: "Description",
      descPlaceholder: "What happened, where, and what you need…",
      create: "Create ticket",
      creating: "Creating…",
      detailShop: "Shop",
      detailMerchant: "Merchant",
      detailCreatedBy: "Created by",
      notLinked: "Not linked",
      unknown: "Unknown",
      description: "Description",
      noDescription: "No description was added for this ticket.",
      timeline: "Timeline",
      created: "Created",
      resolved: "Resolved",
      archived: "Archived",
      activity: "Activity",
      noActivity: "No changes recorded yet.",
      createdThisTicket: "created this ticket",
      madeChange: "made a change",
      changed: "changed",
      system: "System",
      start: "Start",
      resolve: "Resolve",
      reopenTicket: "Reopen ticket",
      archive: "Archive",
      restore: "Restore",
      deletePermanently: "Delete permanently",
      deleteConfirm: "Permanently delete this ticket? This cannot be undone.",
      opened: "Opened {{when}}",
      minutesAgo: "{{n}}m ago",
      hoursAgo: "{{n}}h ago",
    },
    portal: {
      title: "Merchant portal",
      welcome: "Welcome",
      myLease: "My lease",
      myInvoices: "My invoices",
    },
    leasing: {
      title: "Leasing",
      leads: "Leads",
      followUp: "Follow up",
      converted: "Converted",
    },
    admin: {
      title: "Administration",
      settings: "System settings",
      users: "Users",
      system: "System",
    },
    statuses: {
      free: "Free",
      occupied: "Occupied",
      expiring: "Expiring",
      fit_out: "Fit-out",
      on_hold: "On hold",
      overdue: "Overdue",
      normal: "Normal",
      inventory: "Inventory",
      absconded: "Absconded",
      moved_out: "Moved out",
      showroom: "Showroom",
      holding: "Holding",
      follow_up: "Follow up",
      unknown: "Unknown",
      empty: "Empty",
    },
  },
  zh: {
    nav: {
      map: "地图",
      merchants: "商户",
      invoices: "发票",
      tickets: "工单",
      dashboards: "仪表盘",
      staff: "员工",
      leads: "招商",
      settings: "设置",
    },
    common: {
      save: "保存",
      cancel: "取消",
      delete: "删除",
      edit: "编辑",
      add: "添加",
      search: "搜索",
      loading: "加载中…",
      logOut: "退出",
      all: "全部",
      reset: "重置",
      close: "关闭",
      confirm: "确认",
      language: "语言",
      pageOf: "第 {{page}} 页，共 {{total}} 页",
      previous: "上一页",
      next: "下一页",
    },
    auth: {
      brand: "龙城",
      welcomeBack: "欢迎回来",
      subtitle: "登录以管理商铺、财务与工单。",
      emailLabel: "邮箱",
      passwordLabel: "密码",
      showPassword: "显示密码",
      hidePassword: "隐藏密码",
      signIn: "登录",
      signingIn: "登录中…",
      deactivated: "该账号已被停用，请联系管理员。",
      footerHint: "账号由管理员创建 — 如需访问权限请联系管理员。",
      locationLine: "沙特阿拉伯 · 利雅得 · 仅限内部使用",
    },
    map: {
      title: "地图",
      subtitle: "交互式平面图与区域网格，查看商铺 occupancy。",
      planView: "地图视图",
      gridView: "列表视图",
      planViewHint: "正在显示交互式地图 — 点击任意商铺查看详情。切换到列表视图可查看所有商铺的简单表格。",
      gridViewHint: "正在以简单表格显示所有商铺。切换到地图视图可在地图上查看商铺布局。",
      referencePlan: "参考图纸",
      referencePlanDesc: "仅供参考 — 实时地图单独维护。",
      openInNewTab: "新标签页打开",
      noShops: "暂无商铺。",
      addShopHint: "添加商铺",
      total: "合计",
      zone: "区域",
      filterByStatus: "按状态筛选",
      linkedUnits: "关联单元",
      noFloorPlan: "该楼层暂无平面图。",
    },
    merchants: {
      title: "商户",
      subtitle: "商户档案 — 从地图关联一个铺位以创建租约。",
      addMerchant: "添加商户",
      exportCsv: "导出 CSV",
      importCsv: "导入 CSV",
      statTotal: "商户总数",
      statCompanies: "公司",
      statIndividuals: "个人",
      statActiveShops: "在租铺位",
      statLogins: "{{n}} 个登录账号",
      searchPlaceholder: "按名称或电话搜索…",
      typeAll: "全部类型",
      typeIndividual: "个人",
      typeCompany: "公司",
      colName: "名称",
      colType: "类型",
      colContact: "联系方式",
      colActiveShops: "在租铺位",
      none: "无",
      more: "还有 {{n}} 个",
      showing: "显示第 {{from}}–{{to}} 条，共 {{count}} 个商户",
      noMatchFilters: "没有符合筛选条件的商户",
      emptyPrefix: "暂无商户。点击",
      emptySuffix: "开始。",
      noMatchFiltersLong: "没有符合筛选条件的商户。",
      addDialogTitle: "添加商户",
      addDialogDesc: "创建商户档案 — 之后可从地图关联铺位。",
      fieldName: "名称",
      fieldType: "类型",
      fieldCrNumber: "商业登记号",
      fieldContactName: "联系人姓名",
      fieldPhone: "电话",
      fieldEmail: "邮箱",
      fieldNotes: "备注",
      optional: "选填",
      save: "保存",
      saving: "保存中…",
      importDialogTitle: "导入商户",
      importDialogDesc: "CSV 列：名称、类型（个人/公司）、电话。表头行可选。",
      csvFile: "CSV 文件",
      import: "导入",
      importing: "导入中…",
      imported: "已导入 {{n}} 个商户。",
      backLink: "← 商户",
      tabOverview: "概览",
      tabShops: "铺位",
      tabInvoices: "账单",
      tabTickets: "工单",
      tabDocuments: "文件",
      tabAccount: "账号",
      statOutstanding: "未结余额",
      statOpenTickets: "未结工单",
      statLogin: "登录账号",
      loginActive: "已开通",
      loginNone: "无",
      infoContact: "联系人",
      infoPhone: "电话",
      infoEmail: "邮箱",
      infoCrNumber: "商业登记号",
      activeShopsHeading: "在租铺位",
      assignShop: "关联铺位",
      noActiveShops: "暂无在租铺位。点击关联铺位开始。",
      colUnit: "铺位",
      colPeriod: "租期",
      colRent: "租金",
      open: "长期",
      endLease: "结束租约",
      ending: "结束中…",
      leaseHistoryHeading: "租约历史",
      colStatus: "状态",
      noInvoicesYet: "暂无账单。",
      colDue: "到期日",
      colTotal: "总额",
      colBalance: "余额",
      invoiceOverdue: "逾期",
      invoicePaid: "已付",
      invoicePending: "待付",
      noTicketsFromMerchant: "该商户暂无工单。",
      colTicketType: "类型",
      colShop: "铺位",
      colDepartment: "部门",
      colOpened: "创建时间",
      noDocuments: "暂无存档文件。",
      uploadDocument: "上传文件",
      assignDialogTitle: "为该商户关联铺位",
      assignDialogDesc: "仅列出无在租租约的铺位。",
      shopLabel: "铺位",
      startDate: "开始日期",
      endDate: "结束日期",
      rent: "租金",
      deposit: "保证金",
      serviceFee: "服务费",
      billingStatus: "计费状态",
      billingActive: "正常计费",
      billingFitOut: "装修期（尚未开业）",
      billingFreeUse: "免费使用（已入驻，不计费）",
      assign: "关联铺位",
      assigning: "保存中…",
      loginTitle: "商户登录账号",
      noLoginDesc: "该商户尚未开通门户登录账号。创建后请直接告知密码 — 不会发送邀请邮件。",
      emailLabel: "邮箱",
      passwordLabel: "密码",
      passwordHint: "至少 8 个字符",
      createAccount: "创建账号",
      creatingAccount: "创建中…",
      hasLoginDesc: "该商户可使用以下邮箱登录门户。",
      resetPassword: "重置密码",
      newPasswordLabel: "新密码",
      saveNewPassword: "保存新密码",
      cancel: "取消",
    },
    finance: {
      title: "财务",
      invoices: "账单",
      overdue: "逾期",
      pending: "待付",
      paid: "已付",
    },
    tickets: {
      title: "工单",
      subtitle: "按部门分派的工单队列 — 点击任意工单查看详情与操作。",
      newTicket: "新建工单",
      statOpen: "待处理",
      statInProgress: "处理中",
      statResolved: "已解决",
      statArchived: "已归档",
      searchPlaceholder: "搜索类型、铺位、商户…",
      filterStatusLabel: "状态",
      filterAllStatuses: "全部状态",
      filterDepartmentLabel: "部门",
      filterAllDepartments: "全部部门",
      deptOperations: "运营部",
      deptFinance: "财务部",
      deptMaintenance: "维修部",
      reset: "重置",
      noMatchFilters: "没有符合筛选条件的工单",
      noMatchFiltersLong: "没有符合筛选条件的工单。",
      showing: "显示第 {{from}}–{{to}} 条，共 {{count}} 个工单",
      noShop: "无铺位",
      noMerchant: "无商户",
      colTicket: "工单",
      colShop: "铺位",
      colMerchant: "商户",
      colDept: "部门",
      colStatus: "状态",
      colCreated: "创建时间",
      rowsPerPage: "每页行数",
      pageOf: "第 {{page}} 页，共 {{total}} 页",
      previousPage: "上一页",
      nextPage: "下一页",
      createDialogTitle: "新建工单",
      createDialogDesc: "将分派给对应部门 — 默认其他部门不可见。",
      fieldDepartment: "部门",
      fieldType: "类型",
      typePlaceholder: "维修请求、投诉…",
      fieldShop: "铺位",
      none: "无",
      fieldMerchant: "商户",
      fieldDescription: "描述",
      descPlaceholder: "发生了什么、在哪里、需要什么…",
      create: "创建工单",
      creating: "创建中…",
      detailShop: "铺位",
      detailMerchant: "商户",
      detailCreatedBy: "创建人",
      notLinked: "未关联",
      unknown: "未知",
      description: "描述",
      noDescription: "该工单未填写描述。",
      timeline: "时间线",
      created: "已创建",
      resolved: "已解决",
      archived: "已归档",
      activity: "动态记录",
      noActivity: "暂无变更记录。",
      createdThisTicket: "创建了该工单",
      madeChange: "进行了修改",
      changed: "修改了",
      system: "系统",
      start: "开始处理",
      resolve: "标记解决",
      reopenTicket: "重新打开工单",
      archive: "归档",
      restore: "恢复",
      deletePermanently: "永久删除",
      deleteConfirm: "确定要永久删除该工单吗？此操作无法撤销。",
      opened: "创建于 {{when}}",
      minutesAgo: "{{n}} 分钟前",
      hoursAgo: "{{n}} 小时前",
    },
    portal: {
      title: "商户门户",
      welcome: "欢迎",
      myLease: "我的租约",
      myInvoices: "我的账单",
    },
    leasing: {
      title: "招商",
      leads: "线索",
      followUp: "跟进",
      converted: "已转化",
    },
    admin: {
      title: "系统管理",
      settings: "系统设置",
      users: "用户",
      system: "系统",
    },
    statuses: {
      free: "空置",
      occupied: "已租",
      expiring: "即将到期",
      fit_out: "装修中",
      on_hold: "暂停",
      overdue: "欠费",
      normal: "正常",
      inventory: "库存",
      absconded: "跑路",
      moved_out: "已搬离",
      showroom: "展厅",
      holding: "保留",
      follow_up: "待跟进",
      unknown: "未知",
      empty: "空铺",
    },
  },
  ar: {
    nav: {
      map: "الخريطة",
      merchants: "التجار",
      invoices: "الفواتير",
      tickets: "التذاكر",
      dashboards: "لوحات المعلومات",
      staff: "الموظفون",
      leads: "العملاء المحتملون",
      settings: "الإعدادات",
    },
    common: {
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      add: "إضافة",
      search: "بحث",
      loading: "جاري التحميل…",
      logOut: "تسجيل الخروج",
      all: "الكل",
      reset: "إعادة",
      close: "إغلاق",
      confirm: "تأكيد",
      language: "اللغة",
      pageOf: "صفحة {{page}} من {{total}}",
      previous: "السابق",
      next: "التالي",
    },
    auth: {
      brand: "مدينة التنين",
      welcomeBack: "مرحباً بعودتك",
      subtitle: "سجّل الدخول لإدارة المحلات والمالية والطلبات.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      signIn: "تسجيل الدخول",
      signingIn: "جاري تسجيل الدخول…",
      deactivated: "تم إيقاف هذا الحساب. يرجى التواصل مع المسؤول.",
      footerHint: "يتم إنشاء الحسابات من قِبل المسؤول — تواصل مع المسؤول إذا احتجت إلى صلاحية الوصول.",
      locationLine: "الرياض، المملكة العربية السعودية · للاستخدام الداخلي فقط",
    },
    map: {
      title: "الخريطة",
      subtitle: "مخطط الطابق التفاعلي وشبكة المناطق لحالة المحلات.",
      planView: "عرض الخريطة",
      gridView: "عرض القائمة",
      planViewHint: "يعرض هذا الخريطة التفاعلية — انقر على أي محل لعرض تفاصيله. بدّل إلى عرض القائمة لجدول بسيط لكل المحلات.",
      gridViewHint: "يعرض هذا جدولاً بسيطًا لكل المحلات. بدّل إلى عرض الخريطة لعرضها على الخريطة.",
      referencePlan: "المخطط المرجعي",
      referencePlanDesc: "للمرجع فقط — الخريطة الحية تُدار بشكل منفصل.",
      openInNewTab: "فتح في تبويب جديد",
      noShops: "لا توجد محلات بعد.",
      addShopHint: "إضافة محل",
      total: "الإجمالي",
      zone: "المنطقة",
      filterByStatus: "تصفية حسب الحالة",
      linkedUnits: "وحدات مرتبطة",
      noFloorPlan: "لا توجد صورة مخطط لهذا الطابق.",
    },
    merchants: {
      title: "التجار",
      subtitle: "سجلات التجار — اربط محلاً من الخريطة لإنشاء عقد إيجار.",
      addMerchant: "إضافة تاجر",
      exportCsv: "تصدير CSV",
      importCsv: "استيراد CSV",
      statTotal: "إجمالي التجار",
      statCompanies: "الشركات",
      statIndividuals: "الأفراد",
      statActiveShops: "المحلات المؤجرة",
      statLogins: "{{n}} حساب دخول",
      searchPlaceholder: "ابحث بالاسم أو الهاتف…",
      typeAll: "جميع الأنواع",
      typeIndividual: "فرد",
      typeCompany: "شركة",
      colName: "الاسم",
      colType: "النوع",
      colContact: "جهة الاتصال",
      colActiveShops: "المحلات المؤجرة",
      none: "لا يوجد",
      more: "+{{n}} أخرى",
      showing: "عرض {{from}}–{{to}} من {{count}} تاجر",
      noMatchFilters: "لا يوجد تجار مطابقون لهذه التصفية",
      emptyPrefix: "لا يوجد تجار بعد. اضغط على",
      emptySuffix: "للبدء.",
      noMatchFiltersLong: "لا يوجد تجار مطابقون للتصفية.",
      addDialogTitle: "إضافة تاجر",
      addDialogDesc: "أنشئ سجل التاجر — ثم اربطه بمحل من الخريطة.",
      fieldName: "الاسم",
      fieldType: "النوع",
      fieldCrNumber: "رقم السجل التجاري",
      fieldContactName: "اسم جهة الاتصال",
      fieldPhone: "الهاتف",
      fieldEmail: "البريد الإلكتروني",
      fieldNotes: "ملاحظات",
      optional: "اختياري",
      save: "حفظ",
      saving: "جارٍ الحفظ…",
      importDialogTitle: "استيراد التجار",
      importDialogDesc: "أعمدة CSV: الاسم، النوع (فرد/شركة)، الهاتف. صف العناوين اختياري.",
      csvFile: "ملف CSV",
      import: "استيراد",
      importing: "جارٍ الاستيراد…",
      imported: "تم استيراد {{n}} تاجر.",
      backLink: "← التجار",
      tabOverview: "نظرة عامة",
      tabShops: "المحلات",
      tabInvoices: "الفواتير",
      tabTickets: "التذاكر",
      tabDocuments: "المستندات",
      tabAccount: "الحساب",
      statOutstanding: "الرصيد المستحق",
      statOpenTickets: "التذاكر المفتوحة",
      statLogin: "حساب الدخول",
      loginActive: "مُفعّل",
      loginNone: "لا يوجد",
      infoContact: "جهة الاتصال",
      infoPhone: "الهاتف",
      infoEmail: "البريد الإلكتروني",
      infoCrNumber: "رقم السجل التجاري",
      activeShopsHeading: "المحلات المؤجرة",
      assignShop: "ربط محل",
      noActiveShops: "لا توجد محلات مؤجرة. اربط محلاً للبدء.",
      colUnit: "المحل",
      colPeriod: "المدة",
      colRent: "الإيجار",
      open: "مفتوحة",
      endLease: "إنهاء العقد",
      ending: "جارٍ الإنهاء…",
      leaseHistoryHeading: "سجل العقود",
      colStatus: "الحالة",
      noInvoicesYet: "لا توجد فواتير بعد.",
      colDue: "الاستحقاق",
      colTotal: "الإجمالي",
      colBalance: "الرصيد",
      invoiceOverdue: "متأخر",
      invoicePaid: "مدفوع",
      invoicePending: "معلق",
      noTicketsFromMerchant: "لا توجد تذاكر من هذا التاجر.",
      colTicketType: "النوع",
      colShop: "المحل",
      colDepartment: "القسم",
      colOpened: "تاريخ الفتح",
      noDocuments: "لا توجد مستندات محفوظة.",
      uploadDocument: "رفع مستند",
      assignDialogTitle: "ربط محل بهذا التاجر",
      assignDialogDesc: "المحلات غير المؤجرة فقط مُدرجة هنا.",
      shopLabel: "المحل",
      startDate: "تاريخ البدء",
      endDate: "تاريخ الانتهاء",
      rent: "الإيجار",
      deposit: "التأمين",
      serviceFee: "رسوم الخدمة",
      billingStatus: "حالة الفوترة",
      billingActive: "نشط (يُفوتر بشكل طبيعي)",
      billingFitOut: "تجهيز (لم يفتتح بعد)",
      billingFreeUse: "استخدام مجاني (مشغول، بدون فوترة)",
      assign: "ربط المحل",
      assigning: "جارٍ الحفظ…",
      loginTitle: "حساب دخول التاجر",
      noLoginDesc: "لا يملك هذا التاجر حساب دخول للبوابة بعد. أنشئ حساباً وشارك كلمة المرور مباشرة — لا يوجد بريد دعوة.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      passwordHint: "8 أحرف على الأقل",
      createAccount: "إنشاء الحساب",
      creatingAccount: "جارٍ الإنشاء…",
      hasLoginDesc: "يمكن لهذا التاجر تسجيل الدخول إلى البوابة بالبريد الإلكتروني أدناه.",
      resetPassword: "إعادة تعيين كلمة المرور",
      newPasswordLabel: "كلمة المرور الجديدة",
      saveNewPassword: "حفظ كلمة المرور الجديدة",
      cancel: "إلغاء",
    },
    finance: {
      title: "المالية",
      invoices: "الفواتير",
      overdue: "متأخر",
      pending: "معلق",
      paid: "مدفوع",
    },
    tickets: {
      title: "التذاكر",
      subtitle: "قائمة عمل موجهة حسب القسم — اضغط على أي تذكرة لعرض التفاصيل والإجراءات.",
      newTicket: "تذكرة جديدة",
      statOpen: "مفتوحة",
      statInProgress: "قيد المعالجة",
      statResolved: "محلولة",
      statArchived: "مؤرشفة",
      searchPlaceholder: "ابحث بالنوع أو المحل أو التاجر…",
      filterStatusLabel: "الحالة",
      filterAllStatuses: "جميع الحالات",
      filterDepartmentLabel: "القسم",
      filterAllDepartments: "جميع الأقسام",
      deptOperations: "التشغيل",
      deptFinance: "المالية",
      deptMaintenance: "الصيانة",
      reset: "إعادة",
      noMatchFilters: "لا توجد تذاكر مطابقة لهذه التصفية",
      noMatchFiltersLong: "لا توجد تذاكر مطابقة لهذه التصفية.",
      showing: "عرض {{from}}–{{to}} من {{count}} تذكرة",
      noShop: "بلا محل",
      noMerchant: "بلا تاجر",
      colTicket: "التذكرة",
      colShop: "المحل",
      colMerchant: "التاجر",
      colDept: "القسم",
      colStatus: "الحالة",
      colCreated: "تاريخ الإنشاء",
      rowsPerPage: "صفوف لكل صفحة",
      pageOf: "صفحة {{page}} من {{total}}",
      previousPage: "الصفحة السابقة",
      nextPage: "الصفحة التالية",
      createDialogTitle: "تذكرة جديدة",
      createDialogDesc: "تُوجَّه إلى القسم المسؤول عنها — لا يراها أحد غيره افتراضياً.",
      fieldDepartment: "القسم",
      fieldType: "النوع",
      typePlaceholder: "طلب صيانة، شكوى…",
      fieldShop: "المحل",
      none: "لا يوجد",
      fieldMerchant: "التاجر",
      fieldDescription: "الوصف",
      descPlaceholder: "ما الذي حدث، وأين، وما الذي تحتاجه…",
      create: "إنشاء التذكرة",
      creating: "جارٍ الإنشاء…",
      detailShop: "المحل",
      detailMerchant: "التاجر",
      detailCreatedBy: "أنشأها",
      notLinked: "غير مرتبط",
      unknown: "غير معروف",
      description: "الوصف",
      noDescription: "لم يُضَف وصف لهذه التذكرة.",
      timeline: "الجدول الزمني",
      created: "أُنشئت",
      resolved: "حُلّت",
      archived: "أُرشفت",
      activity: "سجل النشاط",
      noActivity: "لا توجد تغييرات مسجلة بعد.",
      createdThisTicket: "أنشأ هذه التذكرة",
      madeChange: "أجرى تعديلاً",
      changed: "عدّل",
      system: "النظام",
      start: "بدء المعالجة",
      resolve: "وضع علامة محلولة",
      reopenTicket: "إعادة فتح التذكرة",
      archive: "أرشفة",
      restore: "استعادة",
      deletePermanently: "حذف نهائي",
      deleteConfirm: "هل تريد حذف هذه التذكرة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.",
      opened: "فُتحت {{when}}",
      minutesAgo: "قبل {{n}} دقيقة",
      hoursAgo: "قبل {{n}} ساعة",
    },
    portal: {
      title: "بوابة التاجر",
      welcome: "مرحباً",
      myLease: "عقدي",
      myInvoices: "فواتيري",
    },
    leasing: {
      title: "التأجير",
      leads: "العملاء المحتملون",
      followUp: "متابعة",
      converted: "تم التحويل",
    },
    admin: {
      title: "الإدارة",
      settings: "إعدادات النظام",
      users: "المستخدمون",
      system: "النظام",
    },
    statuses: {
      free: "شاغر",
      occupied: "مؤجر",
      expiring: "ينتهي قريباً",
      fit_out: "تجهيز",
      on_hold: "معلق",
      overdue: "متأخر السداد",
      normal: "عادي",
      inventory: "مخزون",
      absconded: "هارب",
      moved_out: "انتقل",
      showroom: "معرض",
      holding: "محجوز",
      follow_up: "متابعة",
      unknown: "غير معروف",
      empty: "فارغ",
    },
  },
};

export function isLocale(value: string): value is Locale {
  return value === "en" || value === "zh" || value === "ar";
}
