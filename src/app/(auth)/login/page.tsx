"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      setError("This account has been deactivated. Contact an admin.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center px-4 py-8"
      style={{ paddingTop: "max(2rem, env(safe-area-inset-top))", paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 20%, oklch(0.88 0.05 200 / 0.55), transparent), radial-gradient(ellipse 60% 45% at 85% 80%, oklch(0.9 0.04 250 / 0.45), transparent)",
        }}
      />
      <Card className="relative w-full max-w-sm border-border/60 shadow-xl shadow-slate-900/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-tight text-primary-foreground">
            DC
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Dragon City</CardTitle>
            <CardDescription>Sign in to manage shops, finance, and requests</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
