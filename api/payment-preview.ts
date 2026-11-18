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
        phone: String(decoded.m ?? decoded.phone ?? ""),
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
  const phone = value(params, "phone").replace(/\D/g, "").slice(0, 10);

  if (!Number.isFinite(amount) || amount <= 0 || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upi)) {
    return res.status(400).send("Invalid payment QR details.");
  }

  const paymentUri = new URL("upi://pay");
  paymentUri.searchParams.set("pa", upi);
  paymentUri.searchParams.set("pn", payee);
  paymentUri.searchParams.set("am", amount.toFixed(2));
  paymentUri.searchParams.set("cu", "INR");
  paymentUri.searchParams.set("tn", note);

  const qrImageUrl =
    "https://api.qrserver.com/v1/create-qr-code/?size=900x900&format=png&margin=18&data=" +
    encodeURIComponent(paymentUri.toString());

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

  const safeDownloadName = name.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "player";
  const title = "TurfMate | Payment QR";
  const description = `Your cricket payment QR is ready. View the amount and scan the personalised QR to pay${name ? ` for ${name}` : ""}.`;
  const hostHeader = req.headers?.["x-forwarded-host"] || req.headers?.host || "turfmate.vercel.app";
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader).split(",")[0].trim();
  const protocolHeader = req.headers?.["x-forwarded-proto"] || "https";
  const protocol = (Array.isArray(protocolHeader) ? protocolHeader[0] : protocolHeader).split(",")[0].trim();
  const canonicalUrl = `${protocol}://${host}${req.url || "/api/payment-preview"}`;

  const downloadUrl = token ? "/api/payment-qr?d=" + encodeURIComponent(token) : "";
  // Ask Android to launch the installed app directly. Do not send users to the Play Store as a browser fallback.
  const gpayIntent = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.google.android.apps.nbu.paisa.user;end";
  const phonePeIntent = "intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=com.phonepe.app;end";

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
.hint{text-align:center;color:#718078;font-size:12px;line-height:1.5}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.action{display:flex;align-items:center;justify-content:center;min-height:48px;padding:12px;border:0;border-radius:10px;background:#147a59;color:#fff;text-align:center;text-decoration:none;font-weight:700;font-size:14px;cursor:pointer}.action.secondary{background:#eef5f1;color:#176447;border:1px solid #d9e8df}.action.wide{grid-column:1/-1}#download-personalised-qr{display:block;width:100%;max-width:100%;margin:0 0 18px;box-sizing:border-box}.details{margin-top:18px;padding:14px;border:1px solid #e5ece8;border-radius:12px;background:#fbfdfc}.detail{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid #edf1ee;font-size:13px}.detail:last-child{border-bottom:0}.detail-value{display:flex;flex:1;min-width:0;flex-direction:column;align-items:flex-start;gap:5px}.detail-value span{color:#66766e;overflow-wrap:anywhere}.detail-value strong{color:#203a32;overflow-wrap:anywhere;text-align:left;word-break:break-word}.detail button{border:0;border-radius:8px;padding:8px 10px;background:#eaf7f0;color:#126b4c;font-weight:700;white-space:nowrap}.instructions{margin:16px 0 0;padding:14px 14px 14px 32px;background:#f6f9f7;border-radius:12px;color:#52665b;font-size:13px;line-height:1.7}.status{text-align:center;min-height:18px;margin:10px 0 0;color:#147a59;font-size:12px;font-weight:700;transition:opacity .2s}.status.success{padding:8px 12px;border-radius:8px;background:#edf8f1;color:#147a56}.detail button.copy-inline{width:76px;min-width:76px;height:36px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 76px}.detail button.copy-inline .copy-label{display:block;white-space:nowrap}.detail button.copy-inline.copied{background:#e4f5eb;color:#116b4a}.detail button.copy-inline:disabled{opacity:1;cursor:default}@media(max-width:420px){body{padding:12px}main{margin:10px auto;padding:20px}.actions{grid-template-columns:1fr}.action.wide{grid-column:auto}.detail{align-items:center;flex-wrap:nowrap}.detail-value{min-width:0}.detail-value strong{max-width:100%}}
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
<div class="details">
<div class="detail"><div class="detail-value"><span>UPI ID</span><strong>${escapeHtml(upi)}</strong></div><button type="button" class="copy-inline" data-copy="${escapeHtml(upi)}" aria-label="Copy UPI ID"><span class="copy-label">Copy</span></button></div>
${phone.length === 10 ? "<div class=\"detail\"><div class=\"detail-value\"><span>Mobile number</span><strong>"+escapeHtml(phone)+"</strong></div><button type=\"button\" class=\"copy-inline\" data-copy=\""+escapeHtml(phone)+"\" aria-label=\"Copy mobile number\"><span class=\"copy-label\">Copy</span></button></div>" : ""}
</div>
${downloadUrl ? "<button class=\"action wide\" id=\"download-personalised-qr\" type=\"button\">↓ Download personalised QR card</button>" : ""}
<div class="actions"><a class="action secondary" href="${escapeHtml(gpayIntent)}">Open Google Pay</a><a class="action secondary" href="${escapeHtml(phonePeIntent)}">Open PhonePe</a></div>
<ol class="instructions"><li>Download your personalised QR image.</li><li>Open GPay or PhonePe and choose Scan QR.</li><li>Tap the gallery / upload option and select the downloaded image.</li><li>Confirm the payee and amount before entering your UPI PIN.</li></ol>
<p class="status" id="copy-status" aria-live="polite"></p>
<script>
(function configurePlatformPaymentLinks(){
  const userAgent = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  // Launch the installed app only. Do not pass UPI payment details to either app.
  const buttons = document.querySelectorAll('.actions a');
  if (buttons[0]) buttons[0].href = "gpay://";
  if (buttons[1]) buttons[1].href = "phonepe://";
})();
async function copyValue(text,button){let copied=false;try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);copied=true;}else{const input=document.createElement("textarea");input.value=text;input.setAttribute("readonly","");input.style.position="fixed";input.style.opacity="0";document.body.appendChild(input);input.select();copied=document.execCommand("copy");input.remove();}}catch(e){copied=false;}const status=document.getElementById("copy-status");if(!copied){if(status)status.textContent="Could not copy. Please select and copy manually.";return;}if(status){status.textContent="✓ Copied to clipboard";status.classList.add("success");}if(button){const label=button.querySelector(".copy-label");const old=label?label.textContent:button.textContent;if(label)label.textContent="✓ Copied";else button.textContent="✓ Copied";button.classList.add("copied");button.disabled=true;setTimeout(()=>{if(label)label.textContent=old;else button.textContent=old;button.classList.remove("copied");button.disabled=false;},1800);}}
document.querySelectorAll("[data-copy]").forEach(button=>button.addEventListener("click",()=>copyValue(button.getAttribute("data-copy")||"",button)));
const downloadButton=document.getElementById("download-personalised-qr");
if(downloadButton)downloadButton.addEventListener("click",async()=>{const old=downloadButton.textContent;downloadButton.disabled=true;downloadButton.textContent="Preparing QR card…";try{
 const response=await fetch(${JSON.stringify(downloadUrl)});if(!response.ok)throw new Error("QR unavailable");const qrBlob=await response.blob(),qrUrl=URL.createObjectURL(qrBlob);
 try{const qrImage=new Image();await new Promise((resolve,reject)=>{qrImage.onload=resolve;qrImage.onerror=reject;qrImage.src=qrUrl;});
 const items=${JSON.stringify(sessions).replace(/</g,"\\u003c")};const canvas=document.createElement("canvas"),width=1000,qrSize=420,rows=Math.max(1,Math.ceil(items.length/3)),qrTop=570+rows*76,height=qrTop+qrSize+220;canvas.width=width;canvas.height=height;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
 const rounded=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fill();};
 ctx.fillStyle="#F1F6F4";ctx.fillRect(0,0,width,height);rounded(34,34,932,height-68,30,"#FFFFFF");ctx.fillStyle="#147A59";ctx.font="800 36px Arial";ctx.fillText("TURFMATE",78,108);ctx.fillStyle="#728278";ctx.font="700 18px Arial";ctx.textAlign="right";ctx.fillText("PERSONALISED PAYMENT QR",922,106);ctx.textAlign="left";
 ctx.fillStyle="#7A8790";ctx.font="700 18px Arial";ctx.fillText("PREPARED FOR",78,180);ctx.fillStyle="#203A32";ctx.font="800 52px Arial";ctx.fillText(${JSON.stringify(name)},78,244,840);
 rounded(70,282,860,158,22,"#EAF7F0");ctx.fillStyle="#547466";ctx.font="700 18px Arial";ctx.fillText("TOTAL OUTSTANDING",104,330);ctx.fillStyle="#126B4C";ctx.font="800 58px Arial";ctx.fillText(${JSON.stringify(money(amount))},104,402);
 ctx.fillStyle="#344B42";ctx.font="700 19px Arial";ctx.fillText(items.length?"COVERS "+items.length+" PENDING SESSION"+(items.length===1?"":"S"):"TURFMATE CONTRIBUTION",78,494);
 items.forEach((item,index)=>{const col=index%3,row=Math.floor(index/3),x=70+col*294,y=520+row*76;rounded(x,y,276,52,13,"#F3F6F5");ctx.fillStyle="#43594F";ctx.font="700 17px Arial";ctx.fillText((item.venue||"Session")+" · "+(item.date||""),x+14,y+33,248);});
 rounded(280,qrTop-22,440,440,22,"#FFFFFF");ctx.drawImage(qrImage,290,qrTop,420,420);ctx.fillStyle="#263E34";ctx.font="700 19px Arial";ctx.textAlign="center";ctx.fillText("SCAN TO PAY · AMOUNT PREFILLED",500,qrTop+qrSize+58);ctx.fillStyle="#738178";ctx.font="16px Arial";ctx.fillText("Pay to "+${JSON.stringify(payee)},500,qrTop+qrSize+102);ctx.fillStyle="#147A59";ctx.font="700 20px Arial";ctx.fillText(${JSON.stringify(upi)},500,qrTop+qrSize+139,850);ctx.fillStyle="#8A9690";ctx.font="15px Arial";ctx.fillText("If already paid, please ignore this reminder.",500,qrTop+qrSize+184);ctx.textAlign="left";
 const card=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Unable to render card")),"image/png"));const objectUrl=URL.createObjectURL(card),link=document.createElement("a");link.href=objectUrl;link.download="TurfMate-${safeDownloadName}-personalised-payment.png";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),1500);
 }finally{URL.revokeObjectURL(qrUrl);}
 }catch(error){const status=document.getElementById("copy-status");if(status)status.textContent="Could not prepare the personalised QR card. Please try again.";console.error(error);}finally{downloadButton.disabled=false;downloadButton.textContent=old;}});
</script>
<footer>Shared securely from TurfMate · Pay to ${escapeHtml(payee)}</footer>
</main></body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).send(html);
}
