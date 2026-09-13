"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function getNotifications() {
  const supabase = await createClient();
  // channel='email' rows are a delivery log, not something to surface
  // in the bell — the in_app row for the same event is the one people see.
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, sent_at, read_at")
    .eq("channel", "in_app")
    .order("sent_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  revalidatePath("/", "layout");
}
