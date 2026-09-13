// One-time bootstrap for the very first admin account — every account
// after this one is created by an admin through the Accounts screen.
//
// Usage:
//   node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<full name>"

import { createClient } from "@supabase/supabase-js";

const [email, password, fullName] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin.mjs <email> <password> "<full name>"');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { role: "admin", full_name: fullName ?? null },
});

if (error) {
  console.error("Failed to create admin:", error.message);
  process.exit(1);
}

console.log(`Admin account created: ${data.user.email} (${data.user.id})`);
