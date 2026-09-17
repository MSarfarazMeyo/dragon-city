import type { Json } from "@/lib/supabase/database.types";

type RuleTemplate = {
  template: string;
  template_i18n?: Json | null;
};

/** Prefer English i18n template, then first available locale, then legacy `template`. */
export function resolveNotificationTemplate(rule: RuleTemplate, locale = "en"): string {
  const i18n = rule.template_i18n;
  if (i18n && typeof i18n === "object" && !Array.isArray(i18n)) {
    const map = i18n as Record<string, unknown>;
    const preferred = map[locale];
    if (typeof preferred === "string" && preferred.trim()) return preferred;
    const en = map.en;
    if (typeof en === "string" && en.trim()) return en;
    for (const value of Object.values(map)) {
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return rule.template;
}

export function applyTemplateVars(template: string, vars: Record<string, string>): string {
  let body = template;
  for (const [key, value] of Object.entries(vars)) {
    body = body.replaceAll(`{{${key}}}`, value);
  }
  return body;
}
