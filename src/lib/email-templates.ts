// Branded HTML for outbound notification emails (nodemailer's `html` field,
// sent alongside a plain-text fallback). Table-based layout with every style
// inlined — the only way to look right in Outlook desktop as well as Gmail —
// echoing the login page's navy → teal gradient and "龙" motif so the emails
// read as the same product.

const NAVY = "#16213b";
const NAVY_MID = "#1f3358";
const TEAL = "#14b8a6";
const AMBER = "#d97706";
const ROSE = "#e11d48";
const INK = "#1f2937";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const CARD_BG = "#ffffff";
const PAGE_BG = "#f3f4f6";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Shared shell: navy banner with the Dragon City wordmark, white card, footer. */
export function emailLayout(opts: { previewText?: string; bodyHtml: string }) {
  const { previewText = "", bodyHtml } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dragon City</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${CARD_BG};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${NAVY};background:linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 55%, ${TEAL} 130%);padding:28px 32px;" bgcolor="${NAVY}">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:22px;line-height:1;color:#ffffff;font-weight:700;letter-spacing:0.01em;vertical-align:middle;">
                      <span style="display:inline-block;width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,0.14);text-align:center;line-height:30px;font-size:16px;margin-right:10px;vertical-align:middle;">龙</span>
                      <span style="vertical-align:middle;">Dragon City</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">${bodyHtml}</td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:12px;color:${MUTED};">
                  Dragon City Mall Management · Riyadh, Saudi Arabia · Internal use only
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:${MUTED};">
                  This is an automated message — please don't reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const STATUS_STYLES: Record<string, [string, string, string]> = {
  paid: ["#d1fae5", "#047857", "Paid"],
  overdue: ["#fee2e2", ROSE, "Overdue"],
  pending: ["#e0f2fe", "#0369a1", "Pending"],
  locked: ["#fee2e2", ROSE, "Locked"],
  unlocked: ["#d1fae5", "#047857", "Unlocked"],
  open: ["#e0f2fe", "#0369a1", "Open"],
  in_progress: ["#fef3c7", AMBER, "In progress"],
  resolved: ["#d1fae5", "#047857", "Resolved"],
};

function statusBadge(status: string) {
  const [bg, fg, label] = STATUS_STYLES[status.toLowerCase()] ?? ["#e5e7eb", INK, status];
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:600;">${label}</span>`;
}

function infoRow(label: string, value: string, opts?: { strong?: boolean; last?: boolean }) {
  const border = opts?.last ? "" : `border-bottom:1px solid ${BORDER};`;
  const weight = opts?.strong ? "700" : "500";
  return `<tr>
    <td style="padding:11px 0;${border}font-size:13px;color:${MUTED};width:42%;">${escapeHtml(label)}</td>
    <td style="padding:11px 0;${border}font-size:14px;color:${INK};font-weight:${weight};text-align:right;">${value}</td>
  </tr>`;
}

function money(n: number, currency = "SAR") {
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The invoice-family email — used for invoice created/resent, invoice due
 * reminders, and payment confirmations. Leads with who and where (merchant,
 * shop) before the numbers (period, due date, amount, balance, status), the
 * order a finance person actually reads a confirmation letter in.
 */
export function renderInvoiceEmail(params: {
  headline: string;
  introText: string;
  merchantName: string;
  unitCode: string;
  periodStart?: string;
  periodEnd?: string;
  dueDate?: string;
  totalAmount?: number;
  balance?: number;
  paidAmount?: number;
  status?: string;
  currency?: string;
}) {
  const {
    headline,
    introText,
    merchantName,
    unitCode,
    periodStart,
    periodEnd,
    dueDate,
    totalAmount,
    balance,
    paidAmount,
    status,
    currency = "SAR",
  } = params;

  const rows: string[] = [];
  rows.push(infoRow("Merchant", escapeHtml(merchantName)));
  rows.push(infoRow("Shop", escapeHtml(unitCode)));
  if (periodStart && periodEnd) rows.push(infoRow("Period", `${escapeHtml(periodStart)} → ${escapeHtml(periodEnd)}`));
  if (dueDate) rows.push(infoRow("Due date", escapeHtml(dueDate)));
  if (typeof paidAmount === "number") rows.push(infoRow("Paid", money(paidAmount, currency)));
  if (typeof balance === "number") rows.push(infoRow("Balance", money(balance, currency), { strong: balance > 0.009 }));
  if (typeof totalAmount === "number") {
    rows.push(infoRow("Total amount", money(totalAmount, currency), { strong: true, last: !status }));
  }
  if (status) rows.push(infoRow("Status", statusBadge(status), { last: true }));

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:19px;color:${INK};">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 22px;font-size:14px;color:${MUTED};line-height:1.5;">${escapeHtml(introText)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;padding:4px 16px;">
      ${rows.join("")}
    </table>
  `;

  return emailLayout({ previewText: `${headline} — ${unitCode} · ${merchantName}`, bodyHtml });
}

/** Lease-lock status changes and lease-expiry reminders — same shop/merchant framing as the invoice email, without money fields. */
export function renderLeaseEmail(params: {
  headline: string;
  introText: string;
  merchantName: string;
  unitCode: string;
  endDate?: string;
  status?: string;
}) {
  const { headline, introText, merchantName, unitCode, endDate, status } = params;

  const rows: string[] = [];
  rows.push(infoRow("Merchant", escapeHtml(merchantName)));
  rows.push(infoRow("Shop", escapeHtml(unitCode)));
  if (endDate) rows.push(infoRow("Lease end date", escapeHtml(endDate)));
  if (status) rows.push(infoRow("Status", statusBadge(status), { last: true }));

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:19px;color:${INK};">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 22px;font-size:14px;color:${MUTED};line-height:1.5;">${escapeHtml(introText)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;padding:4px 16px;">
      ${rows.join("")}
    </table>
  `;

  return emailLayout({ previewText: `${headline} — ${unitCode} · ${merchantName}`, bodyHtml });
}

/** Ticket created/resolved — used for both directions (staff opening a
 * ticket for a merchant, and a merchant's own portal submission routed to
 * staff), so `recipientContext` reads naturally either way. */
export function renderTicketEmail(params: {
  headline: string;
  introText: string;
  unitCode: string;
  ticketType: string;
  department?: string;
  description?: string | null;
  status: string;
}) {
  const { headline, introText, unitCode, ticketType, department, description, status } = params;

  const rows: string[] = [];
  rows.push(infoRow("Shop", escapeHtml(unitCode)));
  rows.push(infoRow("Type", escapeHtml(ticketType)));
  if (department) rows.push(infoRow("Department", escapeHtml(department)));
  rows.push(infoRow("Status", statusBadge(status), { last: !description }));
  if (description) rows.push(infoRow("Details", escapeHtml(description), { last: true }));

  const bodyHtml = `
    <h1 style="margin:0 0 6px;font-size:19px;color:${INK};">${escapeHtml(headline)}</h1>
    <p style="margin:0 0 22px;font-size:14px;color:${MUTED};line-height:1.5;">${escapeHtml(introText)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;padding:4px 16px;">
      ${rows.join("")}
    </table>
  `;

  return emailLayout({ previewText: `${headline} — ${unitCode}`, bodyHtml });
}

/** Fallback wrapper for events that don't have a dedicated template yet (tickets, lease reminders) — keeps every email on-brand. */
export function renderGenericEmail(title: string, bodyText: string) {
  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:19px;color:${INK};">${escapeHtml(title)}</h1>
    <p style="margin:0;font-size:14px;color:${INK};line-height:1.6;white-space:pre-line;">${escapeHtml(bodyText)}</p>
  `;
  return emailLayout({ previewText: title, bodyHtml });
}

export const emailBrand = { NAVY, NAVY_MID, TEAL, AMBER, ROSE };
