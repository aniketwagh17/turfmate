type QueryValue = string | string[] | undefined;
type Request = {
  method?: string;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
};
type Response = {
  setHeader(name: string, value: string): void;
  status(code: number): Response;
  send(body: string): void;
};

const value = (query: Record<string, QueryValue>, key: string) => {
  const item = query[key];
  return (Array.isArray(item) ? item[0] : item || "").trim();
};

const escapeHtml = (input: string) =>
  input.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] || char);

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export default function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const query = req.query || {};
  let paymentData: Record<string, string> = {};
  const token = value(query, "d");
  if (token) {
    try {
      const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const binary = atob(paddedBase64);
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const decoded = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
      paymentData = {
        name: String(decoded.n ?? decoded.name ?? ""),
        amount: String(decoded.a ?? decoded.amount ?? ""),
        upi: String(decoded.u ?? decoded.upi ?? ""),
        payee: String(decoded.p ?? decoded.payee ?? ""),
        note: String(decoded.t ?? decoded.note ?? ""),
        sessions: String(decoded.s ?? decoded.sessions ?? ""),
      };
    } catch {
      return res.status(400).send("Invalid payment link.");
    }
  }
  const params = { ...query, ...paymentData };
  const name = value(params, "name").slice(0, 80) || "TurfMate player";
  const amount = Number(value(params, "amount"));
  const upi = value(params, "upi").slice(0, 100);
  const payee = value(params, "payee").slice(0, 80) || "TurfMate";
  const note = value(params, "note").slice(0, 80) || "TurfMate contribution";

  if (!Number.isFinite(amount) || amount <= 0 || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upi)) {
    return res.status(400).send("Invalid payment QR details.");
  }

  const paymentUri = new URL("upi://pay");
  paymentUri.searchParams.set("pa", upi);
  paymentUri.searchParams.set("pn", payee);
  paymentUri.searchParams.set("am", amount.toFixed(2));
  paymentUri.searchParams.set("cu", "INR");
  paymentUri.searchParams.set("tn", note);

  // Keep the QR on the standard generic UPI URI. Offer app-specific deep links
  // as separate launch paths because some Android browsers/UPI handlers behave
  // differently for generic and app-targeted intents.
  const paymentQuery = paymentUri.search;
  const genericPaymentLink = paymentUri.toString();
  const gpayPaymentLink = "tez://upi/pay" + paymentQuery;
  const phonePePaymentLink = "phonepe://pay" + paymentQuery;

  const qrImageUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=900x900&format=png&margin=18&data=" +
    encodeURIComponent(genericPaymentLink);

  const sessions = value(params, "sessions")
    .split("~")
    .filter(Boolean)
    .slice(0, 12)
    .map((entry) => {
      const [date = "", venue = "", due = ""] = entry.split("|");
      const numericDue = Number(due);
      return {
        date: date.slice(0, 10),
        venue: venue.slice(0, 80),
        due: Number.isFinite(numericDue) ? numericDue : 0,
      };
    });

  const sessionRows = sessions.length
    ? sessions.map((session) =>
        `<li><span>${escapeHtml(session.venue)} · ${escapeHtml(session.date)}</span><strong>${escapeHtml(money(session.due))}</strong></li>`
      ).join("")
    : "<li><span>Cricket contribution</span><strong>" + escapeHtml(money(amount)) + "</strong></li>";

  const title = "TurfMate | Payment QR";
  const description = `Your cricket payment QR is ready. View the amount and scan the personalised QR to pay${name ? ` for ${name}` : ""}.`;
  const hostHeader = req.headers?.["x-forwarded-host"] || req.headers?.host || "turfmate.vercel.app";
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(",")[0].trim();
  const protocolHeader = req.headers?.["x-forwarded-proto"] || "https";
  const protocol = (Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader).split(",")[0].trim();
  const canonicalUrl = `${protocol}://${host}${req.url || "/api/payment-preview"}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="Your TurfMate payment QR is ready">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:image" content="${escapeHtml(qrImageUrl)}">
<meta property="og:image:secure_url" content="${escapeHtml(qrImageUrl)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="900">
<meta property="og:image:height" content="900">
<meta property="og:image:alt" content="Personalised UPI payment QR for ${escapeHtml(name)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Your TurfMate payment QR is ready">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(qrImageUrl)}">
<style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#f1f6f4;color:#203a32;font-family:Arial,sans-serif}
main{max-width:520px;margin:24px auto;padding:28px;background:#fff;border:1px solid #e2ebe6;border-radius:20px;box-shadow:0 12px 36px #142b3d12}
.brand{font-size:13px;font-weight:800;letter-spacing:2px;color:#147a59}.eyebrow{margin:28px 0 8px;color:#7a8790;font-size:11px;font-weight:700;letter-spacing:1px}
h1{margin:0;font-size:28px;overflow-wrap:anywhere}.amount{margin:18px 0;padding:18px;background:#eaf7f0;border-radius:14px}.amount small{display:block;color:#547466;font-size:11px;font-weight:700}.amount strong{display:block;margin-top:6px;color:#126b4c;font-size:32px}
ul{list-style:none;padding:0;margin:20px 0}li{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #edf1ee;font-size:13px}li span{overflow-wrap:anywhere}li strong{white-space:nowrap}
.qr{display:block;width:min(100%,340px);height:auto;margin:20px auto 8px;padding:10px;border:1px solid #e5ece8;border-radius:12px}
.hint{text-align:center;color:#718078;font-size:12px;line-height:1.5}.pay-options{display:grid;gap:10px;margin:18px 0}.pay{display:block;padding:14px 18px;border-radius:10px;background:#147a59;color:#fff;text-align:center;text-decoration:none;font-weight:700}.pay.secondary{background:#edf6f1;color:#176447;border:1px solid #d5e9dd}.pay-note{text-align:center;color:#718078;font-size:11px;line-height:1.5;margin:8px 0 0}
footer{margin-top:22px;text-align:center;color:#8a9690;font-size:11px}
</style>
</head>
<body><main>
<div class="brand">🏏 TURFMATE</div>
<div class="eyebrow">PERSONALISED PAYMENT REQUEST</div>
<h1>${escapeHtml(name)}</h1>
<div class="amount"><small>TOTAL OUTSTANDING</small><strong>${escapeHtml(money(amount))}</strong></div>
<ul>${sessionRows}</ul>
<img class="qr" src="${escapeHtml(qrImageUrl)}" alt="UPI payment QR code for ${escapeHtml(name)}">
<p class="hint">Scan this QR using any UPI app. The amount and payment note are already filled in.</p>
<div class="pay-options">
<a class="pay" href="${escapeHtml(genericPaymentLink)}">Pay using any UPI app</a>
<a class="pay secondary" href="${escapeHtml(gpayPaymentLink)}">Pay using Google Pay</a>
<a class="pay secondary" href="${escapeHtml(phonePePaymentLink)}">Pay using PhonePe</a>
</div>
<p class="pay-note">If a payment app does not open or payment fails, return here and scan the QR with that app.</p>
<footer>Shared securely from TurfMate · Pay to ${escapeHtml(payee)}</footer>
</main></body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
}
