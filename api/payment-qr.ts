type QueryValue = string | string[] | undefined;
type Request = { method?: string; query?: Record<string, QueryValue> };
type Response = { setHeader(name: string, value: string): void; status(code: number): Response; send(body: string | Uint8Array): void };
const value = (query: Record<string, QueryValue>, key: string) => { const item=query[key]; return (Array.isArray(item)?item[0]:item||"").trim(); };
const safeName = (value: string) => value.replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "TurfMate-player";
export default async function handler(req: Request,res: Response){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).send("Method not allowed");}
 const query=req.query||{};let data:Record<string,string>={};const token=value(query,"d");
 if(token){try{const base64=token.replace(/-/g,"+").replace(/_/g,"/");const padded=base64+"=".repeat((4-(base64.length%4))%4);const binary=atob(padded);const bytes=Uint8Array.from(binary,(char)=>char.charCodeAt(0));const decoded=JSON.parse(new TextDecoder().decode(bytes)) as Record<string,unknown>;data={name:String(decoded.n??decoded.name??""),amount:String(decoded.a??decoded.amount??""),upi:String(decoded.u??decoded.upi??""),payee:String(decoded.p??decoded.payee??""),note:String(decoded.t??decoded.note??"")};}catch{return res.status(400).send("Invalid payment link.");}}
 const params={...query,...data};const name=value(params,"name").slice(0,80)||"TurfMate player";const amount=Number(value(params,"amount"));const upi=value(params,"upi").slice(0,100);const payee=value(params,"payee").slice(0,80)||"TurfMate";const note=value(params,"note").slice(0,80)||"TurfMate contribution";
 if(!Number.isFinite(amount)||amount<=0||! /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(upi))return res.status(400).send("Invalid payment QR details.");
 const uri=new URL("upi://pay");uri.searchParams.set("pa",upi);uri.searchParams.set("pn",payee);uri.searchParams.set("am",amount.toFixed(2));uri.searchParams.set("cu","INR");uri.searchParams.set("tn",note);
 const qrUrl="https://api.qrserver.com/v1/create-qr-code/?size=900x900&format=png&margin=18&data="+encodeURIComponent(uri.toString());
 try{const response=await fetch(qrUrl);if(!response.ok)throw new Error("QR provider error");const contentType=response.headers.get("content-type")||"";if(!contentType.includes("image/png"))throw new Error("Unexpected QR response");const imageBytes=new Uint8Array(await response.arrayBuffer());
  res.setHeader("Content-Type","image/png");res.setHeader("Content-Disposition","attachment; filename=\""+safeName(name)+"-payment-qr.png\"");res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");return res.status(200).send(imageBytes);
 }catch{return res.status(502).send("Unable to generate the QR image right now. Please try again.");}
}