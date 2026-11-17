type QueryValue = string | string[] | undefined;
type Request = { method?: string; query?: Record<string, QueryValue> };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; send(body: string): void };

const get = (q: Record<string, QueryValue>, key: string, fallback: string) => {
  const v = q[key];
  const value = (Array.isArray(v) ? v[0] : v || fallback).trim();
  return value.slice(0, 120);
};
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c] || c));

export default function handler(req: Request, res: Response) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }
  const q = req.query || {};
  const values = {
    pa: get(q, "pa", "aniketwagh17-2@oksbi"),
    pn: get(q, "pn", "Aniket Wagh"),
    am: get(q, "am", "1.00"),
    tn: get(q, "tn", "TurfMate Cricket - Aniket")
  };
  const safe = Object.fromEntries(Object.entries(values).map(([k,v]) => [k, esc(v)]));
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>TurfMate UPI URI diagnostics</title><style>
*{box-sizing:border-box}body{margin:0;padding:18px;background:#f3f6f4;color:#20352d;font:15px Arial,sans-serif}
main{max-width:850px;margin:12px auto;background:#fff;padding:22px;border-radius:16px;border:1px solid #dfe9e3}
h1{font-size:24px;margin:0 0 8px}.sub{color:#64756c;line-height:1.5}.fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
label{display:block;font-size:12px;font-weight:bold;color:#50635a}input{width:100%;padding:12px;margin-top:6px;border:1px solid #ccd9d1;border-radius:8px;font-size:15px}
button{border:0;border-radius:8px;background:#147a59;color:#fff;padding:11px 15px;font-weight:bold;cursor:pointer}.card{border:1px solid #e1e9e4;border-radius:12px;padding:15px;margin:14px 0;overflow-wrap:anywhere}
.card h2{font-size:17px;margin:0 0 8px}.uri{padding:10px;background:#f3f6f4;border-radius:8px;font:12px monospace;word-break:break-all;line-height:1.5}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.secondary{background:#e8f2ec;color:#176447}
small{color:#68796f}.qr{display:block;width:230px;max-width:100%;margin:12px auto}.warn{background:#fff7e7;border:1px solid #f0dfb5;padding:12px;border-radius:9px;font-size:13px;line-height:1.5}
@media(max-width:560px){.fields{grid-template-columns:1fr}main{padding:16px}}
</style></head><body><main>
<h1>🏏 TurfMate UPI diagnostics</h1>
<p class="sub">This page compares three standard UPI URI variants. It does not initiate a payment automatically. Change the fields and tap Generate to inspect the exact encoded strings.</p>
<div class="fields">
<label>UPI ID (pa)<input id="pa" value="${safe.pa}"></label>
<label>Payee name (pn)<input id="pn" value="${safe.pn}"></label>
<label>Amount (am)<input id="am" value="${safe.am}" inputmode="decimal"></label>
<label>Transaction note (tn)<input id="tn" value="${safe.tn}"></label>
</div><button id="generate">Generate / refresh comparison</button>
<div class="warn" style="margin-top:16px">Safety: inspect and compare these values first. Only proceed with a payment if you intentionally choose to test it. Never share your UPI PIN or OTP.</div>
<div id="results"></div>
<script>
const byId=id=>document.getElementById(id);
const enc=s=>new URLSearchParams([["x",s]]).toString().slice(2);
const make=(keys,v)=>{const p=new URLSearchParams();for(const k of keys)p.set(k,v[k]);return "upi://pay?"+p.toString()};
const variants=[
 {title:"A — Minimal (pa + am + cu)",keys:["pa","am","cu"]},
 {title:"B — Add payee name (pa + am + cu + pn)",keys:["pa","am","cu","pn"]},
 {title:"C — Add transaction note (pa + am + cu + pn + tn)",keys:["pa","am","cu","pn","tn"]}
];
function render(){
 const v={pa:byId("pa").value.trim(),pn:byId("pn").value.trim(),am:byId("am").value.trim(),tn:byId("tn").value.trim(),cu:"INR"};
 if(!v.pa||!v.am||!/^\\d+(\\.\\d{1,2})?$/.test(v.am)){alert("Enter a UPI ID and a valid amount.");return}
 const root=byId("results");root.innerHTML="";
 variants.forEach((item,i)=>{
   const uri=make(item.keys,v);
   const decoded=[...new URL(uri).searchParams.entries()].map(([k,val])=>k+" = "+val).join("\\n");
   const card=document.createElement("section");card.className="card";
   const heading=document.createElement("h2");heading.textContent=item.title;card.appendChild(heading);
   const raw=document.createElement("div");raw.className="uri";raw.textContent=uri;card.appendChild(raw);
   const details=document.createElement("pre");details.className="uri";details.textContent=decoded;card.appendChild(details);
   const actions=document.createElement("div");actions.className="actions";
   const copy=document.createElement("button");copy.textContent="Copy exact URI";copy.onclick=async()=>{await navigator.clipboard.writeText(uri);copy.textContent="Copied";};actions.appendChild(copy);
   const copyDecoded=document.createElement("button");copyDecoded.className="secondary";copyDecoded.textContent="Copy decoded parameters";copyDecoded.onclick=async()=>{await navigator.clipboard.writeText(decoded);copyDecoded.textContent="Copied";};actions.appendChild(copyDecoded);
   card.appendChild(actions);
   if(i===0){const qr=document.createElement("img");qr.className="qr";qr.alt="QR for minimal UPI URI";qr.src="https://api.qrserver.com/v1/create-qr-code/?size=460x460&margin=12&data="+encodeURIComponent(uri);card.appendChild(qr);const note=document.createElement("small");note.textContent="Minimal variant QR — scanning this QR with GPay succeeded in your test.";card.appendChild(note);const pay=document.createElement("button");pay.style.display="block";pay.style.width="100%";pay.style.marginTop="12px";pay.textContent="Pay using Test A (opens UPI app)";pay.addEventListener("click",()=>{window.location.href=uri});card.appendChild(pay);const hint=document.createElement("small");hint.textContent="This launches the exact same minimal URI encoded in the QR above. Compare the app handoff; no payment starts without your confirmation in the UPI app.";card.appendChild(hint)}
   root.appendChild(card);
 });
 const summary=document.createElement("p");summary.className="sub";summary.textContent="All variants above are generated in this browser from the values shown. The encoded plus signs, percent escapes and decoded values are visible for direct comparison.";root.appendChild(summary);
}
byId("generate").addEventListener("click",render);render();
</script></main></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(html);
}
