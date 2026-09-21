import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/avatar-actions";
import { EditNameForm } from "@/components/staff/edit-name-form";
import { ResetStaffPassword } from "@/components/staff/reset-staff-password";
import { RoleSelect } from "@/components/staff/role-select";
import { StatusToggle } from "@/components/staff/status-toggle";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StaffRoleValue } from "@/app/(staff)/staff/actions";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (myProfile?.role !== "admin") redirect("/map");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, avatar_path, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile || profile.role === "merchant") notFound();

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const email = authUser?.user?.email ?? "—";
  const avatarUrl = await getAvatarUrl(profile.avatar_path);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">
          ← Staff
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <AvatarUpload
            target="staff"
            entityId={profile.id}
            currentUrl={avatarUrl}
            fallbackText={(profile.full_name || email).slice(0, 2).toUpperCase()}
            revalidate={`/staff/${profile.id}`}
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{profile.full_name ?? email}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              {email}
              <Badge variant={profile.status === "active" ? "secondary" : "outline"} className="capitalize">
                {profile.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <EditNameForm userId={profile.id} fullName={profile.full_name} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Role &amp; access</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <RoleSelect userId={profile.id} role={profile.role as StaffRoleValue} />
            <StatusToggle userId={profile.id} status={profile.status} />
          </CardContent>
        </Card>

        <Card className="shadow-sm sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Login credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <ResetStaffPassword userId={profile.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
