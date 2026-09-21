"use client";

import { useActionState } from "react";

import { updateNotificationRule, type AdminFormState } from "@/app/(staff)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Rule = {
  id: string;
  event: string;
  offset_days: number;
  template: string;
  template_i18n: unknown;
};

function templateEn(rule: Rule): string {
  const i18n = rule.template_i18n;
  if (i18n && typeof i18n === "object" && !Array.isArray(i18n)) {
    const en = (i18n as Record<string, unknown>).en;
    if (typeof en === "string") return en;
  }
  return rule.template;
}

export function NotificationRuleForm({ rule }: { rule: Rule }) {
  const [state, formAction, pending] = useActionState<AdminFormState, FormData>(updateNotificationRule, null);

  return (
    <form action={formAction} className="space-y-3 rounded-md border p-4">
      <input type="hidden" name="id" value={rule.id} />
      <div className="text-sm font-medium capitalize">
        {rule.event.replace("_", " ")} · {rule.offset_days} day offset
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Template (fallback)</Label>
        <Input name="template" defaultValue={rule.template} required className="font-mono text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">English template (template_i18n.en)</Label>
        <Input name="template_en" defaultValue={templateEn(rule)} className="font-mono text-xs" />
      </div>
      <p className="text-xs text-muted-foreground">
        Variables: {"{{unit_code}}"}, {"{{due_date}}"}, {"{{end_date}}"}
      </p>
      <Button type="submit" size="sm" disabled={pending}>
        Save template
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
