"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// No signed-in user yet, so there's no profiles.locale to seed from —
// this provider falls back to whatever's in localStorage (i.e. a
// choice made right here) and defaults to English otherwise. Picking a
// language on this screen also carries into the authenticated app,
// since (staff)/(merchant) layouts' own I18nProvider reads the same
// localStorage key before falling back to the profile's saved locale.
export default function LoginPage() {
  return (
    <I18nProvider>
      <LoginForm />
    </I18nProvider>
  );
}

function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Deactivated staff (profiles.status = 'inactive', set from the Staff
    // page) authenticate fine against Supabase Auth itself — the block
    // has to happen here, right after sign-in, by checking their own
    // profile row (readable under RLS as `id = auth.uid()`).
    const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).single();
    if (profile?.status === "inactive") {
      await supabase.auth.signOut();
      setLoading(false);
      setError(t.auth.deactivated);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-8"
      style={{
        background: "linear-gradient(155deg, oklch(0.2 0.03 250) 0%, oklch(0.28 0.05 235) 45%, oklch(0.34 0.08 205) 100%)",
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 15% 10%, oklch(0.72 0.1 195 / 0.35), transparent), radial-gradient(ellipse 50% 40% at 90% 90%, oklch(0.6 0.12 30 / 0.18), transparent)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-10 select-none font-serif text-[26rem] leading-none text-white/[0.04]"
      >
        龙
      </span>

      <div className="absolute top-4 inset-x-4 flex justify-center sm:justify-end">
        <LanguageSwitcher tone="onDark" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <DragonEmblem label={t.auth.brand} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl dark:bg-card/95">
          <div className="mb-6 space-y-1.5 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t.auth.welcomeBack}</h2>
            <p className="text-sm text-muted-foreground">{t.auth.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.emailLabel}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  className="h-12 ps-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.passwordLabel}</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-12 ps-10 pe-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
              {loading ? (
                t.auth.signingIn
              ) : (
                <>
                  {t.auth.signIn}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      <p className="relative mt-8 text-xs text-white/40">{t.auth.locationLine}</p>
    </div>
  );
}

// A restrained, geometric stand-in for a dragon crest — concentric
// rings plus a coiling stroke path — since there's no illustrated logo
// asset in the project yet (see public/, only the Next.js defaults).
function DragonEmblem({ label }: { label: string }) {
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      <circle cx="44" cy="44" r="43" stroke="white" strokeOpacity="0.14" />
      <circle cx="44" cy="44" r="35" stroke="white" strokeOpacity="0.22" />
      <path
        d="M44 14c11 4 18 12 18 22 0 8-5 13-12 13-6 0-10-4-10-9 0-4 3-7 7-7 3 0 5 2 5 5"
        stroke="oklch(0.75 0.12 190)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="4" fill="oklch(0.75 0.12 190)" />
    </svg>
  );
}
