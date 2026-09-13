import { createClient } from "@/lib/supabase/server";
import { AddMerchantDialog } from "@/components/merchants/add-merchant-dialog";

export default async function MerchantsPage() {
  const supabase = await createClient();

  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name, type, cr_number, contact_name, contact_phone, leases(status, units(code))")
    .order("name");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Merchants</h1>
          <p className="text-muted-foreground text-sm">Merchant records — link a shop from the map to create a lease.</p>
        </div>
        <AddMerchantDialog />
      </div>

      {!merchants || merchants.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No merchants yet. Click <span className="font-medium text-foreground">Add merchant</span> to start.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Active shops</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((m) => {
                const activeShops = m.leases
                  .filter((l) => l.status === "active")
                  .map((l) => l.units?.code)
                  .filter(Boolean);
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">{m.type}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {m.contact_name || m.contact_phone
                        ? [m.contact_name, m.contact_phone].filter(Boolean).join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {activeShops.length > 0 ? activeShops.join(", ") : <span className="text-muted-foreground">None</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
