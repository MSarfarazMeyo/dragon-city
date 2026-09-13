import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateMerchantAccountDialog } from "@/components/accounts/create-merchant-account-dialog";

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (myProfile?.role !== "admin") {
    redirect("/map");
  }

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers();

  const { data: profiles } = await supabase.from("profiles").select("id, role, full_name, merchants(name)");
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: merchants } = await supabase.from("merchants").select("id, name").order("name");

  const accounts = authUsers.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      createdAt: u.created_at,
      profile: profileById.get(u.id),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground text-sm">Admin-only. Staff accounts are created via the bootstrap script; merchant accounts here.</p>
        </div>
        <CreateMerchantAccountDialog merchants={merchants ?? []} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Merchant</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">{a.email}</td>
                <td className="px-4 py-2 capitalize text-muted-foreground">{a.profile?.role ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{a.profile?.merchants?.name ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
