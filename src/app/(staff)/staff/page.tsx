import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/avatar-actions";
import { parsePageParams, pageCount } from "@/lib/pagination";
import { AddStaffDialog } from "@/components/staff/add-staff-dialog";
import { StaffFilters } from "@/components/staff/staff-filters";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (myProfile?.role !== "admin") redirect("/map");

  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().toLowerCase();
  const role = typeof params.role === "string" ? params.role : "all";
  const status = typeof params.status === "string" ? params.status : "all";
  const { page, pageSize, from, to } = parsePageParams(params);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, avatar_path, created_at")
    .neq("role", "merchant")
    .order("full_name");

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map(authUsers?.users.map((u) => [u.id, u.email ?? "—"]) ?? []);

  const rows = (profiles ?? [])
    .map((p) => ({ ...p, email: emailById.get(p.id) ?? "—" }))
    .filter((p) => (role === "all" ? true : p.role === role))
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => (q ? p.full_name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) : true));

  const totalPages = pageCount(rows.length, pageSize);
  const pageRows = rows.slice(from, to + 1);
  const avatarUrls = new Map(await Promise.all(pageRows.map(async (p) => [p.id, await getAvatarUrl(p.avatar_path)] as const)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-muted-foreground text-sm">Admin, operations, finance, and maintenance accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StaffFilters defaultQuery={q} defaultRole={role} defaultStatus={status} />
          <AddStaffDialog />
        </div>
      </div>

      {pageRows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          {q || role !== "all" || status !== "all" ? "No staff match your filters." : (
            <>
              No staff yet. Click <span className="font-medium text-foreground">Add staff</span> to start.
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((p) => {
                const avatarUrl = avatarUrls.get(p.id);
                return (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      <Link href={`/staff/${p.id}`} className="flex items-center gap-2.5 hover:underline">
                        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="" className="size-full object-cover" />
                          ) : (
                            (p.full_name || p.email).slice(0, 2).toUpperCase()
                          )}
                        </span>
                        {p.full_name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.email}</td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">{p.role}</td>
                    <td className="px-4 py-2">
                      <Badge variant={p.status === "active" ? "secondary" : "outline"} className="capitalize">
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
