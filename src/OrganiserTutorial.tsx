import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Step = { tab:string; section?:string; target:string; title:string; body:string; action:string };
const steps:Step[] = [
 {tab:"Overview",target:"[data-tutorial='create-session']",title:"1. Create a sample session",body:"We'll create a temporary practice session. Nothing in this walkthrough will be kept in your real workspace.",action:"Tap Add session, then choose Next."},
 {tab:"Sessions",target:"[data-tutorial='session-form-date']",title:"2. Enter the booking details",body:"Use the sample values or your own dummy values. Enter the date, venue and timings, then continue.",action:"Complete the form fields and tap Next."},
 {tab:"Sessions",target:"[data-tutorial='session-form-expenses']",title:"3. Add the expenses",body:"Enter the total session expense and actual turf charges. TurfMate calculates the extra water / balls expense.",action:"Complete the amounts and tap Next."},
 {tab:"Sessions",target:"[data-tutorial='session-form-save']",title:"4. Save your sample session",body:"Create the session. It will exist only in this temporary tutorial workspace.",action:"Tap Create session, then Next."},
 {tab:"Session details",target:"[data-tutorial='session-add-players']",title:"5. Add players to the session",body:"Open Add players. You can select an existing player or create a new dummy player with a sample mobile number.",action:"Tap Add players, add one dummy player and save attendance. Then Next."},
 {tab:"Session details",target:"[data-tutorial='share-session']",title:"6. Preview the group message",body:"See how TurfMate prepares the session announcement and payment details for your WhatsApp group. The tutorial will show a preview only.",action:"Open the preview and return here. Nothing will be sent."},
 {tab:"Players",target:"[data-tutorial='player-reminder']",title:"8. Preview a personal reminder",body:"TurfMate can prepare an individual reminder with the player's pending amount and payment QR. During this tutorial it stays a preview—WhatsApp will not open.",action:"Open the reminder preview and return here."},
 {tab:"Session details",target:"[data-tutorial='approve-payment']",title:"7. Approve a contribution",body:"Review the sample player's amount and use Approve payment to see how an organiser records money received. This is dummy data only.",action:"Tap Approve payment and confirm, then Next."},
 {tab:"Players",target:"[data-tutorial='player-reminder']",title:"8. Preview a personal reminder",body:"TurfMate can prepare an individual reminder with the player's pending amount and payment QR. During this tutorial it stays a preview—WhatsApp will not open.",action:"Open the reminder preview and return here."},
 {tab:"Session details",target:"[data-tutorial='settle-advance']",title:"9. Settle the organiser advance",body:"Once player contributions are recorded, review the fund reconciliation and see how an organiser advance is marked as settled.",action:"Use the settlement action and confirm, then Next."},
 {tab:"Finance",section:"Fund activity",target:"[data-tutorial='fund-activity-panel']",title:"10. Manage fund activity",body:"See where manual contributions and withdrawals are recorded, with a note for every movement.",action:"Review the fields, then Next."},
 {tab:"Finance",section:"Download reports",target:"[data-tutorial='report-panel']",title:"11. Download reports",body:"Explore the detailed finance report and quick turf summary. You can generate a sample PDF from the temporary session.",action:"Try a download if you like, then Next."},
 {tab:"Finance",section:"Payment details",target:"[data-tutorial='payee-panel']",title:"12. Payment details",body:"Review the payee, UPI and fund manager details used to prepare payment QR codes and reminders.",action:"Review this section, then Next."},
 {tab:"Overview",target:"[data-tutorial='create-session']",title:"You're ready to organise!",body:"You've walked through creating a session, adding a player, sharing previews, recording payments, settling the advance and downloading reports.",action:"Finish the tutorial to discard every temporary record and return to your real workspace."}
];

export default function OrganiserTutorial({onClose,onNavigate}:{onClose:()=>void;onNavigate:(tab:string,section?:string)=>void}) {
 const [index,setIndex]=useState(0);
 const [style,setStyle]=useState<CSSProperties>({visibility:"hidden"});
 const card=useRef<HTMLElement>(null);
 const step=steps[index];
 useEffect(()=>{
  onNavigate(step.tab,step.section);
  let cancelled=false,frame=0,tries=0;let target:HTMLElement|null=null;
  const place=()=>{
   if(cancelled||!target||!card.current)return;
   const r=target.getBoundingClientRect(),c=card.current.getBoundingClientRect(),gap=12,margin=12;
   let left=0,top=0,width=window.innerWidth<=760?Math.min(330,window.innerWidth-24):340;
   if(window.innerWidth<=760){
    left=(window.innerWidth-width)/2;
    const below=window.innerHeight-r.bottom-gap,above=r.top-gap;
    top=below>=c.height||below>=above?Math.min(window.innerHeight-c.height-margin,r.bottom+gap):Math.max(margin,r.top-c.height-gap);
   } else {
    left=r.right+width+gap+margin<=window.innerWidth?r.right+gap:Math.max(margin,r.left-width-gap);
    top=Math.max(margin,Math.min(window.innerHeight-c.height-margin,r.top+r.height/2-c.height/2));
   }
   setStyle({position:"fixed",left,top,width,visibility:"visible"});
  };
  const locate=()=>{
   if(cancelled)return;tries++;
   target=document.querySelector<HTMLElement>(step.target);
   if(target){target.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});target.classList.add("tutorial-focus");window.setTimeout(place,260);frame=requestAnimationFrame(place);}
   else if(tries<30)frame=requestAnimationFrame(locate);
  };
  frame=requestAnimationFrame(locate);
  const reposition=()=>place();
  window.addEventListener("resize",reposition);window.addEventListener("scroll",reposition,true);
  return()=>{cancelled=true;cancelAnimationFrame(frame);window.removeEventListener("resize",reposition);window.removeEventListener("scroll",reposition,true);document.querySelectorAll(".tutorial-focus").forEach(el=>el.classList.remove("tutorial-focus"));};
 },[index]);
 const move=(next:number)=>setIndex(Math.max(0,Math.min(steps.length-1,next)));
 return createPortal(<div className="tutorial-layer" role="dialog" aria-modal="true" aria-label="TurfMate practice walkthrough">
  <div className="tutorial-scrim"/>
  <section ref={card} className="tutorial-card tutorial-coach" style={style}>
   <div className="tutorial-card-top"><span>🏏 TURFMATE · PRACTICE MODE</span><button type="button" aria-label="Skip tutorial" onClick={onClose}>×</button></div>
   <div className="tutorial-progress"><span style={{width:((index+1)/steps.length*100)+"%"}}/></div>
   <div className="tutorial-step-meta">STEP {index+1} OF {steps.length}</div>
   <h2>{step.title}</h2><p>{step.body}</p>
   <div className="tutorial-tip"><span>✦</span><span>{step.action}</span></div>
   <div className="tutorial-footer"><button type="button" className="tutorial-skip" onClick={onClose}>Skip tutorial</button><div>
    <button type="button" className="tutorial-secondary" disabled={index===0} onClick={()=>move(index-1)}>Back</button>
    {index===steps.length-1?<button type="button" className="tutorial-primary" onClick={onClose}>Finish ✓</button>:<button type="button" className="tutorial-primary" onClick={()=>move(index+1)}>Next →</button>}
   </div></div>
  </section>
 </div>,document.body);
}
