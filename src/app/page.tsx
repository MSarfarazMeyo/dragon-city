import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-4 p-12">
      <h1 className="text-2xl font-semibold tracking-tight">Dragon City</h1>
      <p className="text-muted-foreground">
        Project scaffolded. Next: Sprint 0 &mdash; Supabase schema, auth, and the shadcn/ui shell.
      </p>
      <Button>shadcn/ui is wired up</Button>
    </main>
  );
}
