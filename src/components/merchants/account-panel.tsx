"use client";

import { useActionState, useState } from "react";
import { KeyRound, Mail } from "lucide-react";

import {
  createMerchantAccount,
  resetMerchantPassword,
  type AccountFormState,
} from "@/app/(staff)/merchants/account-actions";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountPanel({
  merchantId,
  account,
}: {
  merchantId: string;
  account: { id: string; email: string } | null;
}) {
  if (account) return <ResetPasswordCard merchantId={merchantId} account={account} />;
  return <CreateAccountCard merchantId={merchantId} />;
}

function CreateAccountCard({ merchantId }: { merchantId: string }) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(createMerchantAccount, null);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t.merchants.loginTitle}</CardTitle>
        <CardDescription>{t.merchants.noLoginDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-sm space-y-4">
          <input type="hidden" name="merchant_id" value={merchantId} />
          <div className="space-y-2">
            <Label htmlFor="email">{t.merchants.emailLabel}</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.merchants.passwordLabel}</Label>
            <Input id="password" name="password" type="text" placeholder={t.merchants.passwordHint} required minLength={8} />
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? t.merchants.creatingAccount : t.merchants.createAccount}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ResetPasswordCard({
  merchantId,
  account,
}: {
  merchantId: string;
  account: { id: string; email: string };
}) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(resetMerchantPassword, null);
  const [resetting, setResetting] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t.merchants.loginTitle}</CardTitle>
        <CardDescription>{t.merchants.hasLoginDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground" />
          <span className="font-medium">{account.email}</span>
        </div>

        {!resetting ? (
          <Button variant="outline" size="sm" onClick={() => setResetting(true)}>
            <KeyRound className="size-4" />
            {t.merchants.resetPassword}
          </Button>
        ) : (
          <form action={formAction} className="max-w-sm space-y-3">
            <input type="hidden" name="user_id" value={account.id} />
            <input type="hidden" name="merchant_id" value={merchantId} />
            <div className="space-y-2">
              <Label htmlFor="new_password">{t.merchants.newPasswordLabel}</Label>
              <Input id="new_password" name="password" type="text" placeholder={t.merchants.passwordHint} required minLength={8} />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? t.merchants.saving : t.merchants.saveNewPassword}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setResetting(false)}>
                {t.merchants.cancel}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
