export type Locale = "en" | "zh" | "ar";

export type Dictionary = {
  nav: {
    map: string;
    merchants: string;
    finance: string;
    tickets: string;
    dashboards: string;
    accounts: string;
    leasing: string;
    admin: string;
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
  };
  map: {
    title: string;
    subtitle: string;
    planView: string;
    gridView: string;
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
    addMerchant: string;
    name: string;
    contact: string;
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
    open: string;
    closed: string;
    create: string;
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
      finance: "Finance",
      tickets: "Tickets",
      dashboards: "Dashboards",
      accounts: "Accounts",
      leasing: "Leasing",
      admin: "Admin",
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
    },
    map: {
      title: "Map",
      subtitle: "Interactive floor plan and zone grid for shop occupancy.",
      planView: "Plan",
      gridView: "Grid",
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
      addMerchant: "Add merchant",
      name: "Name",
      contact: "Contact",
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
      open: "Open",
      closed: "Closed",
      create: "Create ticket",
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
      finance: "财务",
      tickets: "工单",
      dashboards: "仪表盘",
      accounts: "账户",
      leasing: "招商",
      admin: "管理",
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
    },
    map: {
      title: "地图",
      subtitle: "交互式平面图与区域网格，查看商铺 occupancy。",
      planView: "平面图",
      gridView: "网格",
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
      addMerchant: "添加商户",
      name: "名称",
      contact: "联系方式",
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
      open: "进行中",
      closed: "已关闭",
      create: "创建工单",
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
      finance: "المالية",
      tickets: "التذاكر",
      dashboards: "لوحات المعلومات",
      accounts: "الحسابات",
      leasing: "التأجير",
      admin: "الإدارة",
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
    },
    map: {
      title: "الخريطة",
      subtitle: "مخطط الطابق التفاعلي وشبكة المناطق لحالة المحلات.",
      planView: "المخطط",
      gridView: "الشبكة",
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
      addMerchant: "إضافة تاجر",
      name: "الاسم",
      contact: "جهة الاتصال",
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
      open: "مفتوح",
      closed: "مغلق",
      create: "إنشاء تذكرة",
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
