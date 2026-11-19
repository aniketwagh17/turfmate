import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type DemoTab = "Overview" | "Sessions" | "Session details" | "Players" | "Payments" | "Finance";
type DemoModal = "session" | "edit-session" | "delete-session" | "delete-player" | "attendance" | "quick-player" | "share" | "reminder" | "player" | null;
type TourStep = { tab: DemoTab; section: string; title: string; body: string; target: string; modal?: DemoModal; finance?: string };

const TOUR_STEPS: TourStep[] = [
 {tab:"Overview",section:"NAVIGATION",title:"Overview tab",body:"The Overview tab is your starting point. It gives you a quick snapshot of the group's activity and the most recent turf bookings.",target:"nav-overview"},
 {tab:"Overview",section:"OVERVIEW",title:"Your organiser dashboard",body:"This is your cricket group command centre. At a glance, you can see recent sessions, total turf spend, collections and pending contributions. We’ll walk through the complete organiser journey using a separate sample workspace.",target:"overview-hero"},
 {tab:"Overview",section:"OVERVIEW",title:"Start a new session",body:"Whenever a turf booking is confirmed, start here. Add session opens the booking form. The walkthrough uses a sample booking and never writes anything to your real account.",target:"add-session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Choose the booking date",body:"Select the date of your turf booking. This date is used throughout the session summary, player contributions and reports.",target:"session-date",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Enter the venue",body:"Add the turf or ground name. It becomes the session title shown in the session list, payment records and shared WhatsApp message.",target:"session-venue",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Set the playing time",body:"Set the start and end time so everyone knows when to arrive. The time is displayed on the session page and in the share message.",target:"session-time",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Choose how contributions work",body:"Use the shared cricket fund option when the group maintains a common balance. Choose equal split when each attendee should share the session expense without fund accounting.",target:"session-mode",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Set the fixed contribution",body:"With fund mode enabled, enter the contribution expected from each player. TurfMate tracks any shortfall as an organiser advance and any surplus in the cricket fund.",target:"session-contribution",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Enter total session expenses",body:"Include all session costs here, such as turf, water and balls. This is the complete expense amount used for the session calculation.",target:"session-total",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Enter actual turf charges",body:"Enter only the amount paid to the turf. TurfMate separates this from other expenses so the organiser can understand the cost breakdown.",target:"session-turf",modal:"session"},
 {tab:"Overview",section:"CREATE A SESSION",title:"Create the session",body:"Once the details are ready, Create session saves the booking and takes the organiser to its session workspace. In this tour, the button is illustrative only.",target:"session-create",modal:"session"},
 {tab:"Sessions",section:"NAVIGATION",title:"Sessions tab",body:"All bookings live under Sessions. From here you can open a booking and continue managing its players, payments and settlement.",target:"nav-sessions"},
 {tab:"Sessions",section:"SESSIONS",title:"Your session list",body:"The Sessions tab keeps all bookings together. Each card shows the venue, date, time, selected players and session cost. You can return to a session whenever you need to manage it.",target:"sessions-heading"},
 {tab:"Sessions",section:"SESSIONS",title:"Add a session from this tab",body:"The Add session action is also available here, so you can create a booking while reviewing your session list.",target:"sessions-add"},
 {tab:"Sessions",section:"SESSIONS",title:"Session summary card",body:"This card gives you the key information without opening the session. The sample session has six players and a ₹4,500 total expense.",target:"session-card"},
 {tab:"Sessions",section:"SESSIONS",title:"Add players from the session card",body:"Use Add players to choose who is attending this particular booking. It opens the same attendance picker available inside the session workspace.",target:"session-card-add-players"},
 {tab:"Sessions",section:"SESSIONS",title:"Edit a booking",body:"Edit lets you correct the venue, date, time or expense details for an existing session.",target:"session-card-edit"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Review the edit form",body:"The edit form is prefilled with the saved booking. You can correct any field without creating a second session.",target:"edit-session-date",modal:"edit-session"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Update the venue",body:"Change the turf or ground name if the booking location has changed.",target:"edit-session-venue",modal:"edit-session"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Adjust the playing time",body:"Update the start and end times if the booking slot changes.",target:"edit-session-time",modal:"edit-session"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Update the fixed contribution",body:"If the group uses a shared cricket fund, review the fixed per-player contribution. The fund and equal-split options determine how the session cost is allocated.",target:"edit-session-contribution",modal:"edit-session"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Review the expense values",body:"Check total session expenses, actual turf charges and the fixed contribution before saving. Changing financial details can reset an unsettled organiser advance.",target:"edit-session-total",modal:"edit-session"},
 {tab:"Sessions",section:"EDIT SESSION",title:"Save the updated booking",body:"Save changes updates this session in place. The demo form is read-only and will not change your real session.",target:"edit-session-save",modal:"edit-session"},
 {tab:"Sessions",section:"SESSIONS",title:"Delete a booking",body:"Delete removes the session and its associated payment records. Review the confirmation carefully because this action cannot be undone.",target:"session-card-delete"},
 {tab:"Sessions",section:"DELETE SESSION",title:"Confirm before deleting",body:"The confirmation explains that payments recorded against this session will also be deleted. Keep the session if you are unsure; deletion cannot be undone.",target:"delete-session-confirm",modal:"delete-session"},
 {tab:"Sessions",section:"SESSIONS",title:"Open session details",body:"Select the session summary to open its workspace. This is where the booking, attendance, sharing, payments and settlement are grouped.",target:"session-card-open"},
 {tab:"Session details",section:"SESSION DETAILS",title:"Open a session workspace",body:"A session workspace brings booking details, attendance, sharing, payment collection and settlement into one place. The sample session is already populated so every feature can be demonstrated.",target:"session-detail-heading"},
 {tab:"Session details",section:"SESSION DETAILS",title:"Return to the session list",body:"Use Back to sessions to leave the current booking workspace and return to all your sessions.",target:"session-back"},
 {tab:"Session details",section:"SESSION DETAILS",title:"Booking summary and report",body:"The summary confirms the booking date, timing and turf expense. In the real app, Download PDF creates a session report that can be kept or shared with the group. The demo button does not download a file.",target:"session-pdf"},
 {tab:"Session details",section:"SESSION DETAILS",title:"Manage payments shortcut",body:"This shortcut takes you directly to the payment management area for this session, where you can record contributions and review pending amounts.",target:"manage-payments"},
 {tab:"Session details",section:"SESSION DETAILS",title:"Manage the player list",body:"Use Manage players to choose who is playing in this session. Attendance is session-specific; it does not remove anyone from the main player roster.",target:"manage-players"},
 {tab:"Session details",section:"ATTENDANCE",title:"Search the player roster",body:"The attendance picker lets you search by player name or mobile number. This is useful when your group roster grows.",target:"attendance-search",modal:"attendance"},
 {tab:"Session details",section:"ATTENDANCE",title:"Select players for this session",body:"Tick the players who are attending. The selected roster determines who appears in session payment tracking and how contributions are calculated.",target:"attendance-roster",modal:"attendance"},
 {tab:"Session details",section:"ATTENDANCE",title:"Add a new player from here",body:"If someone is not yet in your roster, you can add them without leaving attendance. The new player is added to the demo workspace only.",target:"attendance-add-player",modal:"attendance"},
 {tab:"Session details",section:"ATTENDANCE",title:"Enter the new player's name",body:"Enter the name your group recognises. The new player is added to the demo roster only.",target:"quick-player-name",modal:"quick-player"},
 {tab:"Session details",section:"ATTENDANCE",title:"Enter the new player's WhatsApp number",body:"A valid 10-digit number lets the organiser prepare personalised payment reminders later.",target:"quick-player-phone",modal:"quick-player"},
 {tab:"Session details",section:"ATTENDANCE",title:"Add the player to the roster",body:"Confirm Add player to include the new member in the session roster. This demo action does not touch your real player list.",target:"quick-player-save",modal:"quick-player"},
 {tab:"Session details",section:"ATTENDANCE",title:"Save attendance",body:"Save attendance confirms the selected players for this booking. The sample attendance is already saved for the rest of this demonstration.",target:"attendance-save",modal:"attendance"},
 {tab:"Session details",section:"SHARE SESSION",title:"Share the session with your group",body:"Share session info prepares a message containing the date, time and player list, along with the common contribution QR details.",target:"share-session"},
 {tab:"Session details",section:"SHARE SESSION",title:"Review the WhatsApp message",body:"The preview shows the exact session information that will be prepared for your group. You can review it before opening WhatsApp.",target:"share-message",modal:"share"},
 {tab:"Session details",section:"SHARE SESSION",title:"Open WhatsApp with the session message",body:"This prepares the group message in WhatsApp. The organiser chooses the group and taps Send; TurfMate does not send it in the background.",target:"share-whatsapp",modal:"share"},
 {tab:"Session details",section:"SHARE SESSION",title:"Download the common payment QR",body:"Download the QR image when you want to attach it separately in your WhatsApp group. Check the per-player amount and payment note before sharing.",target:"share-qr",modal:"share"},
 {tab:"Session details",section:"SHARE SESSION",title:"Payment QR and sharing actions",body:"The common QR is prepared with the per-player amount and payment note. TurfMate opens WhatsApp only after the organiser chooses to do so; it never sends a message automatically.",target:"share-actions",modal:"share"},
 {tab:"Session details",section:"SHARE SESSION",title:"Skip sharing when needed",body:"You do not have to share immediately. Skip for now closes this preview and lets you share later from the same session workspace.",target:"share-skip",modal:"share"},
 {tab:"Session details",section:"PAYMENTS",title:"Manage session payments",body:"This area tracks contributions for the current session. You can see who has paid, who is pending and record a payment without leaving the session.",target:"session-payments"},
 {tab:"Session details",section:"PAYMENTS",title:"Review each player's payment status",body:"Each player row shows the expected contribution, amount received and outstanding balance. Use the row actions to record a payment or prepare a reminder.",target:"session-payment-row"},
 {tab:"Session details",section:"PAYMENTS",title:"Approve a payment",body:"When a player pays outside TurfMate, the organiser can verify the transfer and approve it. This updates that player's paid and outstanding amounts.",target:"approve-session-payment"},
 {tab:"Session details",section:"PAYMENTS",title:"Prepare a personalised reminder",body:"A reminder is specific to one player and includes their pending amount and a personal payment link. It is useful when only a few contributions are outstanding.",target:"payment-reminder"},
 {tab:"Session details",section:"PAYMENT REMINDER",title:"Review the personal reminder",body:"Check the recipient, outstanding amount and message before continuing. The saved player number is used so the reminder goes to the correct chat.",target:"reminder-message",modal:"reminder"},
 {tab:"Session details",section:"PAYMENT REMINDER",title:"Check the payment note",body:"The payment note is included in the player's UPI transaction details. Use a short, recognisable description so the payment can be matched later.",target:"reminder-note",modal:"reminder"},
 {tab:"Session details",section:"PAYMENT REMINDER",title:"Verify the saved WhatsApp number",body:"The recipient number is read-only in this reminder to prevent sending it to the wrong person. Edit the player profile if the saved number needs correction.",target:"reminder-phone",modal:"reminder"},
 {tab:"Session details",section:"PAYMENT REMINDER",title:"WhatsApp is always a manual step",body:"This action would open the selected player's WhatsApp chat with the message prefilled. The organiser still reviews the recipient and taps Send. This demo will not open WhatsApp.",target:"reminder-send",modal:"reminder"},
 {tab:"Session details",section:"SETTLEMENT",title:"Understand organiser advance",body:"If the organiser pays more upfront than the player contributions cover, TurfMate tracks the difference as an organiser advance. It remains visible until reconciled.",target:"organiser-advance"},
 {tab:"Session details",section:"SETTLEMENT",title:"Remind the cricket fund manager",body:"When the advance is ready to settle, you can prepare a reminder for the saved fund manager. The real app opens WhatsApp for your review; it never sends automatically.",target:"remind-fund-manager"},
 {tab:"Session details",section:"SETTLEMENT",title:"Settle the organiser advance",body:"After the group contributions are collected and the advance is validated, mark it as settled. TurfMate records the settlement state so the session accounts remain clear.",target:"settle-advance"},
 {tab:"Players",section:"NAVIGATION",title:"Players tab",body:"The Players tab contains your full group roster. Player details are reused across sessions, attendance and payment reminders.",target:"nav-players"},
 {tab:"Players",section:"PLAYERS",title:"Your player directory",body:"The Players tab is the master roster for your cricket group. Player details are reused in attendance, payments and reminders.",target:"players-heading"},
 {tab:"Players",section:"PLAYERS",title:"Find a player quickly",body:"Search by name or mobile number to find someone in a larger roster. The list updates as you type.",target:"players-search"},
 {tab:"Players",section:"PLAYERS",title:"Filter the player directory",body:"Use the Show filter to narrow the roster to all players, people from the latest session, players with outstanding amounts or fully paid players.",target:"players-filter"},
 {tab:"Players",section:"PLAYERS",title:"Register a new player",body:"Add Player opens the player form. Each player needs a name and a valid WhatsApp number for payment reminders.",target:"players-add"},
 {tab:"Players",section:"ADD PLAYER",title:"Enter the player's name",body:"Use the name your group recognises. Keeping names distinct makes attendance and payment records easier to understand.",target:"player-name",modal:"player"},
 {tab:"Players",section:"ADD PLAYER",title:"Add a WhatsApp number",body:"Enter the player's 10-digit mobile number. TurfMate uses this saved number when preparing a personalised reminder.",target:"player-phone",modal:"player"},
 {tab:"Players",section:"ADD PLAYER",title:"Save the player",body:"Add Player saves the new roster entry. This is a sample-only action in the guided tour; your real player list stays untouched.",target:"player-save",modal:"player"},
 {tab:"Players",section:"PLAYERS",title:"Review a player profile",body:"Player cards show roster details and can expand to show session history and payment context.",target:"player-row"},
 {tab:"Players",section:"PLAYERS",title:"View session history",body:"Expand a player to review the sessions they participated in, total contributions, payments received and outstanding balance.",target:"player-history"},
 {tab:"Players",section:"PLAYERS",title:"Prepare a player payment reminder",body:"For a player with an outstanding amount and a valid saved number, Payment reminder prepares a personalised WhatsApp message and QR link. It never sends automatically.",target:"player-reminder"},
 {tab:"Players",section:"PLAYERS",title:"Edit a player profile",body:"Edit opens the player form so you can correct their name or WhatsApp number. Existing session and payment history remains associated with that player.",target:"player-edit"},
 {tab:"Players",section:"PLAYERS",title:"Delete a player from the roster",body:"A player cannot be deleted while an amount is outstanding. After confirming deletion, the player is removed from future attendance while past sessions, payment records and reports retain their name.",target:"player-delete"},
 {tab:"Players",section:"DELETE PLAYER",title:"Review the player deletion confirmation",body:"The confirmation protects your history: the player is removed from future attendance and the Players list, while past sessions, payments and reports keep the player's name.",target:"delete-player-confirm",modal:"delete-player"},
 {tab:"Payments",section:"NAVIGATION",title:"Payments tab",body:"The Payments tab gives you a consolidated transaction view across sessions.",target:"nav-payments"},
 {tab:"Payments",section:"PAYMENTS",title:"Consolidated payment management",body:"The Payments tab is the organiser's central transaction view. Record a new UPI or cash payment and review the history from one place.",target:"payments-heading"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Choose the session",body:"Select the session for which the money was received. TurfMate uses the session roster to populate the player choices.",target:"payment-session"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Choose the player",body:"Select the player who made the payment. The amount due is calculated from their session contribution and previous payments.",target:"payment-player"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Enter amount and method",body:"Enter the amount received and choose UPI or Cash. Add an optional note such as a UPI reference or cash received.",target:"payment-amount"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Choose the payment method",body:"Select UPI or Cash to record how the contribution was received.",target:"payment-method"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Add a payment note",body:"A short note such as a UPI reference or cash received can make later reconciliation easier.",target:"payment-note"},
 {tab:"Payments",section:"RECORD PAYMENT",title:"Record the payment",body:"Record payment adds the transaction to the session and player history. In the real app, this updates the outstanding balance.",target:"payment-record"},
 {tab:"Payments",section:"PAYMENT HISTORY",title:"Edit or delete a transaction",body:"Use the row actions to correct a recorded amount or remove an entry that was added by mistake. Review the transaction before changing it.",target:"payment-history-actions"},
 {tab:"Payments",section:"PAYMENT HISTORY",title:"Review payment history",body:"The history lists recorded transactions with player, method, date, session and note. Use the row actions to edit or delete an entry when needed.",target:"payment-history"},
 {tab:"Finance",section:"NAVIGATION",title:"Finance tab",body:"Finance contains reports, shared fund activity and organiser payment settings.",target:"nav-finance"},
 {tab:"Finance",section:"FINANCE",title:"Your finance workspace",body:"Finance brings reports, cricket fund activity and organiser payment details together. Use the sub-tabs to move between these areas.",target:"finance-subnav",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Choose a reporting period",body:"Select a date range to focus the report on the period you want to review. The sample workspace includes session and payment history.",target:"report-period",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Set the report start date",body:"For a custom range, choose the first day to include. The date fields appear when Custom date range is selected.",target:"report-start",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Set the report end date",body:"Choose the last day to include in the custom report period.",target:"report-end",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Download the detailed finance report",body:"The detailed PDF includes session expenses, player payments, outstanding contributions and organiser or fund transactions for the selected period. The demo button is illustrative and will not download a file.",target:"report-export",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Review the all-time turf summary",body:"This summary combines imported historical sessions with new TurfMate sessions. The quick summary always includes the complete ledger, independent of the date filter above.",target:"report-summary",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Download the quick summary PDF",body:"Use the quick summary PDF for a compact all-time view of the group’s turf booking history. The demo button does not download a file.",target:"summary-pdf",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Download the quick summary Excel",body:"The Excel version is useful when you want to sort, filter or work with the all-time session ledger. This is separate from the detailed period-based PDF.",target:"summary-xlsx",finance:"Download reports"},
 {tab:"Finance",section:"DOWNLOAD REPORTS",title:"Export your reports",body:"Download the session summary or detailed spreadsheet to keep a record of expenses, collections and outstanding contributions.",target:"report-export",finance:"Download reports"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Track the shared cricket fund",body:"Fund activity shows money entering and leaving the group fund. Contributions increase the balance; withdrawals record money spent from it.",target:"fund-balance",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Record a contribution or withdrawal",body:"Choose the transaction type, enter the amount and add a note. This creates a clear audit trail for group fund movements.",target:"fund-entry",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Choose the transaction type",body:"Select Contribution when money is added to the shared fund, or Withdrawal when money is taken out.",target:"fund-type",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Enter the transaction amount",body:"Enter the exact amount being added or withdrawn. Check the amount before recording it.",target:"fund-amount",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Add a transaction note",body:"Describe why the money moved, for example a player contribution or purchase of cricket balls.",target:"fund-note",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Record the fund transaction",body:"Record transaction adds this movement to the ledger and updates the fund balance.",target:"fund-save",finance:"Fund activity"},
 {tab:"Finance",section:"FUND ACTIVITY",title:"Review the fund ledger",body:"The ledger shows each contribution and withdrawal with its date and note, making it easier to reconcile the shared balance.",target:"fund-ledger",finance:"Fund activity"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Set organiser payment details",body:"These details are used when preparing payment instructions and QR codes for players. Keep them accurate so payments reach the right account.",target:"payment-details",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"UPI ID and payee name",body:"Enter the UPI ID and the name players should see in their UPI app. Players should always verify the payee before completing a payment.",target:"upi-fields",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Check the UPI ID",body:"This is the UPI address players use to pay the organiser. Make sure it is typed correctly.",target:"upi-id",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Confirm the payee name",body:"The payee name should match the recipient players expect to see in their UPI app.",target:"payee-name",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Add a contact number",body:"An optional contact number gives players another way to clarify payment questions.",target:"payee-phone",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Save payment details",body:"Save your organiser UPI details after checking them. These are used to prepare QR codes and payment instructions; payments are still verified manually.",target:"payment-details-save",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Set the cricket fund manager",body:"The fund manager is the person who handles cricket fund reimbursements. Their details are used when preparing a reminder about an organiser advance.",target:"fund-manager-fields",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Enter the fund manager name",body:"Enter the name players recognise for the person managing the shared cricket fund.",target:"fund-manager-name",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Enter the fund manager WhatsApp number",body:"Add a valid mobile number so TurfMate can prepare a WhatsApp reminder when an organiser advance is ready for settlement.",target:"fund-manager-phone",finance:"Payment details"},
 {tab:"Finance",section:"PAYMENT DETAILS",title:"Save fund manager details",body:"Save the fund manager contact details. The real app uses them only when you choose to prepare a reminder; it does not send one automatically.",target:"fund-manager-save",finance:"Payment details"}
];

const demoPlayers = [
 {name:"Aniket",phone:"9876543210",due:"₹0",status:"Paid",initials:"A"},
 {name:"Ajit",phone:"9876501234",due:"₹250",status:"Pending",initials:"A"},
 {name:"Suhas",phone:"9876512345",due:"₹0",status:"Paid",initials:"S"},
 {name:"Sameet",phone:"9876523456",due:"₹250",status:"Pending",initials:"S"},
 {name:"Krunal",phone:"9876534567",due:"₹0",status:"Paid",initials:"K"},
 {name:"Mohak",phone:"9876543211",due:"₹250",status:"Pending",initials:"M"}
];

function Field({id,label,value,hint}:{id:string;label:string;value:string;hint?:string}){
 return <div className="tm-guide-field" data-tour-target={id}><label>{label}</label><div className="tm-guide-input">{value}</div>{hint&&<small>{hint}</small>}</div>;
}
function DemoButton({id,children,primary=false}:{id:string;children:ReactNode;primary?:boolean}){
 return <div className={primary?"tm-guide-button primary":"tm-guide-button"} data-tour-target={id}>{children}</div>;
}
function DemoRow({id,name,detail,amount,status}:{id?:string;name:string;detail:string;amount:string;status:string}){
 return <div className="tm-guide-row" data-tour-target={id}><span className="tm-guide-avatar">{name.slice(0,1)}</span><span className="tm-guide-row-main"><b>{name}</b><small>{detail}</small></span><span className="tm-guide-row-end"><b>{amount}</b><small className={status==="Paid"?"paid":"pending"}>{status}</small></span></div>;
}

export default function GuidedTour({onClose}:{onClose:()=>void}){
 const [index,setIndex]=useState(0);
 const [complete,setComplete]=useState(false);
 const [placement,setPlacement]=useState<{top:number;left:number;width:number;compact:boolean}>({top:12,left:12,width:360,compact:false});
 const [positionReady,setPositionReady]=useState(false);
 const [layoutTick,setLayoutTick]=useState(0);
 const overlayRef=useRef<HTMLDivElement>(null);
 const cardRef=useRef<HTMLDivElement>(null);
 const step=TOUR_STEPS[index];
 const total=TOUR_STEPS.length;
 const navTabs:DemoTab[]=["Overview","Sessions","Players","Payments","Finance"];
 const progress=useMemo(()=>Math.round(((index+1)/total)*100),[index,total]);

 useEffect(()=>{
  let cancelled=false;
  let timer=0;
  let frame=0;
  setPositionReady(false);
  frame=requestAnimationFrame(()=>{
   const target=Array.from(overlayRef.current?.querySelectorAll<HTMLElement>('[data-tour-target="'+step.target+'"]')||[]).find(el=>el.getClientRects().length>0);
   if(!target){setPositionReady(true);return;}
   // Apply the visible spotlight to the exact element the current step describes.
   // The previous preview calculated tooltip placement but never attached this class,
   // so the target was not actually highlighted.
   target.classList.add("tm-guide-focus");
   target.scrollIntoView({behavior:"smooth",block:"center",inline:"nearest"});
   const placeTooltip=()=>{
    if(cancelled)return;
    const card=cardRef.current;
    const rect=target.getBoundingClientRect();
    const vw=window.visualViewport?.width||window.innerWidth;
    const vh=window.visualViewport?.height||window.innerHeight;
    const pad=12,gap=14,width=Math.min(380,vw-24);
    if(card)card.style.width=width+"px";
    const cardHeight=Math.min(card?.getBoundingClientRect().height||220,vh-2*pad);
    const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(value,max));
    const centeredLeft=clamp(rect.left+(rect.width-width)/2,pad,vw-width-pad);
    const centeredTop=clamp(rect.top+(rect.height-cardHeight)/2,pad,vh-cardHeight-pad);
    const candidates=[
     {top:rect.bottom+gap,left:centeredLeft,side:"below"},
     {top:rect.top-cardHeight-gap,left:centeredLeft,side:"above"},
     {top:centeredTop,left:rect.right+gap,side:"right"},
     {top:centeredTop,left:rect.left-width-gap,side:"left"}
    ];
    const overlaps=(x:{top:number;left:number},w:number,h:number)=>x.left<rect.right+9&&x.left+w>rect.left-9&&x.top<rect.bottom+9&&x.top+h>rect.top-9;
    const fits=(x:{top:number;left:number},w:number,h:number)=>x.top>=pad&&x.left>=pad&&x.top+h<=vh-pad&&x.left+w<=vw-pad&&!overlaps(x,w,h);
    const valid=candidates.filter(x=>fits(x,width,cardHeight));
    if(valid.length){
     const below=valid.find(x=>x.side==="below"),above=valid.find(x=>x.side==="above");
     const chosen=below||above||valid[0];
     setPlacement({top:chosen.top,left:chosen.left,width,compact:false});
     setPositionReady(true);
     return;
    }
    const compactHeight=48,compactWidth=Math.min(310,vw-24),compactLeft=clamp((vw-compactWidth)/2,pad,vw-compactWidth-pad);
    const compactCandidates=[
     {top:pad,left:compactLeft,width:compactWidth},
     {top:vh-compactHeight-pad,left:compactLeft,width:compactWidth},
     {top:centeredTop,left:rect.right+gap,width:Math.min(250,vw-24)},
     {top:centeredTop,left:rect.left-Math.min(250,vw-24)-gap,width:Math.min(250,vw-24)}
    ];
    const safe=compactCandidates.filter(x=>fits(x,x.width,compactHeight));
    if(safe.length){
     const chosen=safe.find(x=>x.top===pad&&rect.top>vh/2)||safe.find(x=>x.top>vh/2)||safe[0];
     setPlacement({top:chosen.top,left:chosen.left,width:chosen.width,compact:true});
     setPositionReady(true);
     return;
    }
    // If the highlighted control fills the viewport, move it toward one edge to create a safe
    // strip for the compact cricket-ball control instead of placing the tooltip over the target.
    target.scrollIntoView({behavior:"smooth",block:rect.top>vh/2?"start":"end",inline:"nearest"});
    timer=window.setTimeout(()=>{
     if(cancelled)return;
     const moved=target.getBoundingClientRect();
     const topSafe=moved.top>compactHeight+pad;
     const bottomSafe=vh-moved.bottom>compactHeight+pad;
     const top=topSafe?pad:bottomSafe?vh-compactHeight-pad:pad;
     setPlacement({top,left:compactLeft,width:compactWidth,compact:true});
     setPositionReady(true);
    },420);
   };
   timer=window.setTimeout(placeTooltip,520);
  });
  return()=>{
   cancelled=true;
   cancelAnimationFrame(frame);
   window.clearTimeout(timer);
   overlayRef.current?.querySelectorAll(".tm-guide-focus").forEach(el=>el.classList.remove("tm-guide-focus"));
  };
 },[index,step.target,step.modal,layoutTick]);
 useEffect(()=>{
  const reposition=()=>setLayoutTick(t=>t+1);
  window.addEventListener("resize",reposition);
  window.visualViewport?.addEventListener("resize",reposition);
  return()=>{
   window.removeEventListener("resize",reposition);
   window.visualViewport?.removeEventListener("resize",reposition);
  };
 },[]);
 useEffect(()=>{
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();onClose();}
  };
  window.addEventListener("keydown",onKeyDown);
  return()=>{
   document.body.style.overflow=previousOverflow;
   window.removeEventListener("keydown",onKeyDown);
  };
 },[onClose]);

 const next=()=>{if(index===total-1)setComplete(true);else setIndex(n=>n+1);};
 const back=()=>setIndex(n=>Math.max(0,n-1));

 if(complete)return <div className="tm-guide-overlay tm-guide-complete-overlay" role="dialog" aria-modal="true" aria-label="Tour complete"><section className="tm-guide-complete-card"><div className="tm-guide-complete-ball">🏏</div><small>GUIDED TOUR COMPLETE</small><h1>You’re ready to run your next session.</h1><p>You’ve explored the organiser journey from creating a booking to managing players, collecting payments and keeping the cricket fund in order.</p><div className="tm-guide-complete-summary"><span>✓ {total} guided steps</span><span>✓ Sample data only</span><span>✓ Your real workspace untouched</span></div><button type="button" onClick={onClose}>Return to TurfMate →</button></section></div>;
 return <div className="tm-guide-overlay" ref={overlayRef} role="dialog" aria-modal="true" aria-label="TurfMate guided product tour">
  <div className="tm-guide-app">
   <aside className="tm-guide-sidebar">
    <div className="tm-guide-brand"><span>🏏</span><div><b>TurfMate</b><small>MANHATTAN CRICKET</small></div></div>
    <small className="tm-guide-workspace">WORKSPACE</small>
    {navTabs.map(tab=><div key={tab} data-tour-target={"nav-"+tab.toLowerCase()} className={"tm-guide-nav "+(step.tab===tab||(step.tab==="Session details"&&tab==="Sessions")?"active":"")}>{tab==="Overview"?"⌂":tab==="Sessions"?"◷":tab==="Players"?"♙":tab==="Payments"?"₹":"▤"}<span>{tab}</span></div>)}
    <div className="tm-guide-sidebar-foot"><b>Organiser workspace</b><small>Sample data · Tour only</small></div>
   </aside>
   <main className="tm-guide-main">
    <header className="tm-guide-topbar"><div className="tm-guide-mobile-brand">🏏 <b>TurfMate</b></div><span>Organiser workspace <b>AW</b></span></header>
    <div className="tm-guide-page">
     {step.tab==="Overview"&&<div className="tm-guide-view">
      <section className="tm-guide-hero" data-tour-target="overview-hero"><small>YOUR CRICKET FINANCES, SIMPLIFIED</small><h1>Good game. Clear accounts.</h1><p>Track sessions, contributions and your shared cricket fund.</p><div className="tm-guide-hero-actions"><span className="tm-guide-guide-chip">✦ Guide</span><DemoButton id="add-session" primary>＋ Add session</DemoButton></div></section>
      <div className="tm-guide-stats"><div><small>CRICKET FUND</small><b>₹18,364</b></div><div><small>TOTAL TURF SPEND</small><b>₹13,500</b></div><div><small>COLLECTED</small><b>₹12,250</b></div><div><small>OUTSTANDING</small><b>₹1,250</b></div></div>
      <h2 className="tm-guide-section-title">Recent sessions</h2><div className="tm-guide-card" data-tour-target="overview-recent"><div className="tm-guide-card-title"><b>Titans Turf</b><span>₹4,500</span></div><small>19 Nov 2026 · 9:00 PM – 12:00 AM</small><p>6 players · 3 payments pending</p></div>
     </div>}
     {step.tab==="Sessions"&&<div className="tm-guide-view">
      <div className="tm-guide-page-head" data-tour-target="sessions-heading"><div><h1>Sessions</h1><p>All your turf bookings in one place.</p></div><DemoButton id="sessions-add" primary>＋ Add session</DemoButton></div>
      <div className="tm-guide-card tm-guide-session-card" data-tour-target="session-card"><div className="tm-guide-card-title"><b>Titans Turf</b><span>₹4,500</span></div><small>19 Nov 2026 · 9:00 PM – 12:00 AM</small><p>6 players selected · 3 pending payments</p><div className="tm-guide-card-actions"><DemoButton id="session-card-add-players">＋ Add players</DemoButton><DemoButton id="session-card-edit">✎ Edit</DemoButton><DemoButton id="session-card-delete">⌫ Delete</DemoButton></div><div className="tm-guide-card-open" data-tour-target="session-card-open">View session details →</div></div>
     </div>}
     {step.tab==="Session details"&&<div className="tm-guide-view">
      <div className="tm-guide-page-head" data-tour-target="session-detail-heading"><div><span className="tm-guide-back-link" data-tour-target="session-back">← Back to sessions</span><h1>Titans Turf</h1><p>19 Nov 2026 · 9:00 PM to 12:00 AM</p></div><DemoButton id="session-pdf">↓ Download PDF</DemoButton></div>
      <div className="tm-guide-summary"><div><small>BOOKING DATE</small><b>19 Nov 2026</b></div><div><small>TURF TIMING</small><b>9 PM – 12 AM</b></div><div><small>TURF EXPENSE</small><b>₹4,200</b></div></div>
      <div className="tm-guide-action-grid"><DemoButton id="manage-players">♙ Manage players</DemoButton><DemoButton id="share-session">↗ Share session info</DemoButton><DemoButton id="manage-payments">₹ Manage payments</DemoButton></div>
      <section className="tm-guide-panel" data-tour-target="session-payments"><div className="tm-guide-panel-head"><h2>Session payments</h2><span>3 pending</span></div><DemoRow id="session-payment-row" name="Ajit" detail="Contribution · UPI" amount="₹250 due" status="Pending"/><div className="tm-guide-player-actions" data-tour-target="session-payment-row-actions"><DemoButton id="payment-reminder">Remind</DemoButton><DemoButton id="approve-session-payment" primary>Approve payment</DemoButton></div><DemoRow name="Suhas" detail="Contribution · Cash" amount="₹250" status="Paid"/><DemoRow name="Sameet" detail="Contribution · Pending" amount="₹250 due" status="Pending"/></section>
      <section className="tm-guide-panel tm-guide-advance" data-tour-target="organiser-advance"><div><small>ORGANISER ADVANCE</small><b>₹700</b><p>Amount paid upfront by organiser and awaiting settlement.</p></div><div className="tm-guide-settlement-actions"><DemoButton id="remind-fund-manager">🔔 Remind fund manager</DemoButton><DemoButton id="settle-advance" primary>Settle advance</DemoButton></div></section>
     </div>}
     {step.tab==="Players"&&<div className="tm-guide-view">
      <div className="tm-guide-page-head" data-tour-target="players-heading"><div><h1>Players</h1><p>Manage your player roster.</p><small>6 active players</small></div><DemoButton id="players-add" primary>＋ Add Player</DemoButton></div>
      <div className="tm-guide-search" data-tour-target="players-search">⌕ <span>Search name or mobile number</span></div>
      <div className="tm-guide-player-filter" data-tour-target="players-filter"><small>SHOW</small><span>All Players (6)　⌄</span></div>
      <div className="tm-guide-panel"><div className="tm-guide-panel-head"><h2>Player roster</h2><span>6 players</span></div>
       {demoPlayers.map((p,i)=><div className="tm-guide-player-row" key={p.name} data-tour-target={i===0?"player-row":undefined}><span className="tm-guide-avatar">{p.initials}</span><span className="tm-guide-row-main"><b>{p.name}</b><small>{p.phone}</small></span><span className="tm-guide-row-end"><b>{p.due}</b><small className={p.status==="Paid"?"paid":"pending"}>{p.status}</small></span>{i===1&&<DemoButton id="player-reminder">Payment reminder</DemoButton>}</div>)}
       <div className="tm-guide-player-history" data-tour-target="player-history"><b>Aniket · Player summary</b><div className="tm-guide-summary-stats"><span><b>2</b><small>Sessions played</small></span><span><b>₹500</b><small>Total contribution</small></span><span><b>₹500</b><small>Payments recorded</small></span></div><div className="tm-guide-player-history-rows"><small>Titans Turf · 19 Nov 2026 · Paid ₹250</small><small>Weekend Turf · 12 Nov 2026 · Paid ₹250</small></div></div><div className="tm-guide-player-actions" data-tour-target="player-actions"><DemoButton id="player-edit">✎ Edit player</DemoButton><DemoButton id="player-delete">🗑 Delete player</DemoButton></div>
      </div>
     </div>}
     {step.tab==="Payments"&&<div className="tm-guide-view">
      <div className="tm-guide-page-head" data-tour-target="payments-heading"><div><h1>Payments</h1><p>Record UPI or cash received from players.</p></div></div>
      <div className="tm-guide-columns"><section className="tm-guide-panel"><h2>Record a payment</h2><Field id="payment-session" label="For session" value="Titans Turf · 19 Nov 2026"/><Field id="payment-player" label="Player name" value="Ajit · 9876501234"/><Field id="payment-amount" label="Amount received" value="₹250"/><Field id="payment-method" label="Payment method" value="UPI / Cash"/><Field id="payment-note" label="Note (optional)" value="UPI reference / Cash received"/><DemoButton id="payment-record" primary>Record payment</DemoButton></section><section className="tm-guide-panel" data-tour-target="payment-history"><h2>Payment history</h2><DemoRow name="Aniket" detail="UPI · 19 Nov 2026" amount="₹250" status="Paid"/><DemoRow name="Suhas" detail="Cash · 19 Nov 2026" amount="₹250" status="Paid"/><DemoRow name="Ajit" detail="Titans Turf · Pending" amount="₹250" status="Pending"/><div className="tm-guide-player-actions" data-tour-target="payment-history-actions"><span>✎ Edit payment</span><span>🗑 Delete payment</span></div></section></div>
     </div>}
     {step.tab==="Finance"&&<div className="tm-guide-view">
      <div className="tm-guide-page-head"><div><h1>Finance</h1><p>Manage your cricket fund, reports and organiser payment details.</p></div></div>
      <div className="tm-guide-finance-tabs" data-tour-target="finance-subnav"><span className={step.finance==="Download reports"?"active":""}>Download reports</span><span className={step.finance==="Fund activity"?"active":""}>Fund activity</span><span className={step.finance==="Payment details"?"active":""}>Payment details</span></div>
      {step.finance==="Download reports"&&<section className="tm-guide-panel"><h2>Download reports</h2><div className="tm-guide-report-period" data-tour-target="report-period"><small>PERIOD</small><div className="tm-guide-input">Custom date range　⌄</div></div><div className="tm-guide-fields-two" data-tour-target="report-range"><Field id="report-start" label="From" value="01 Nov 2026"/><Field id="report-end" label="To" value="19 Nov 2026"/></div><div className="tm-guide-report-export" data-tour-target="report-export"><DemoButton id="report-export" primary>↓ Download detailed finance report (PDF)</DemoButton></div><div className="tm-guide-report-summary" data-tour-target="report-summary"><div><h3>All-time turf summary</h3><small>One continuous ledger combining historical sessions and new TurfMate bookings.</small></div><div className="tm-guide-summary-stats"><span><b>17</b><small>Historical sessions</small></span><span><b>4</b><small>TurfMate sessions</small></span><span><b>21</b><small>Total sessions</small></span></div><div className="tm-guide-export-actions"><DemoButton id="summary-pdf">↓ Quick summary (PDF)</DemoButton><DemoButton id="summary-xlsx" primary>↓ Quick summary (Excel)</DemoButton></div></div></section>}
      {step.finance==="Fund activity"&&<><div className="tm-guide-fund-balance" data-tour-target="fund-balance"><small>AVAILABLE CRICKET FUND</small><b>₹18,364</b><span>Updated with session collections and expenses</span></div><div className="tm-guide-columns"><section className="tm-guide-panel" data-tour-target="fund-entry"><h2>Record fund activity</h2><Field id="fund-type" label="Transaction type" value="Contribution / Withdrawal"/><Field id="fund-amount" label="Amount" value="₹500"/><Field id="fund-note" label="Note" value="Player contribution"/><DemoButton id="fund-save" primary>Record transaction</DemoButton></section><section className="tm-guide-panel" data-tour-target="fund-ledger"><h2>Recent activity</h2><DemoRow name="Contribution" detail="18 Nov 2026 · Player contribution" amount="+₹500" status="Paid"/><DemoRow name="Withdrawal" detail="16 Nov 2026 · Cricket balls" amount="−₹350" status="Pending"/></section></div></>}
      {step.finance==="Payment details"&&<><section className="tm-guide-panel" data-tour-target="payment-details"><h2>Organiser payment details</h2><div data-tour-target="upi-fields"><Field id="upi-id" label="UPI ID" value="organiser@upi"/><Field id="payee-name" label="Payee / organiser name" value="TurfMate Organiser"/><Field id="payee-phone" label="Payment contact mobile (optional)" value="9876543210"/></div><DemoButton id="payment-details-save" primary>Save payment details</DemoButton></section><section className="tm-guide-panel"><h2>Cricket fund manager</h2><small>Contact used for organiser advance settlement reminders.</small><div data-tour-target="fund-manager-fields"><Field id="fund-manager-name" label="Fund manager name" value="Bhavesh Bhai"/><Field id="fund-manager-phone" label="WhatsApp mobile number" value="7977543969"/></div><DemoButton id="fund-manager-save" primary>Save fund manager details</DemoButton></section></>}
     </div>}
    </div>
    <nav className="tm-guide-mobile-nav">{navTabs.map(tab=><span key={tab} data-tour-target={"nav-"+tab.toLowerCase()} className={step.tab===tab||(step.tab==="Session details"&&tab==="Sessions")?"active":""}>{tab==="Overview"?"Home":tab}</span>)}</nav>
   </main>
   {step.modal&&<div className="tm-guide-modal-layer"><section className="tm-guide-modal">
    <div className="tm-guide-modal-head"><div><small>GUIDED DEMO · SAMPLE DATA</small><h2>{step.modal==="session"?"Add session":step.modal==="edit-session"?"Edit session":step.modal==="delete-session"?"Delete session?":step.modal==="delete-player"?"Delete player?":step.modal==="attendance"?"Manage session players":step.modal==="quick-player"?"Add a player to the roster":step.modal==="share"?"Share session & player list":step.modal==="reminder"?"Personalised payment reminder":"Register Player"}</h2></div><span>×</span></div>
    {step.modal==="session"&&<div className="tm-guide-modal-fields"><Field id="session-date" label="Date" value="19 Nov 2026"/><Field id="session-venue" label="Venue" value="Titans Turf"/><div className="tm-guide-fields-two" data-tour-target="session-time"><Field id="session-start" label="Start time" value="09:00 PM"/><Field id="session-end" label="End time" value="12:00 AM"/></div><div className="tm-guide-choice-group" data-tour-target="session-mode"><b>Does your group maintain a cricket fund?</b><span className="selected">● Yes, we maintain a shared cricket fund</span><span>○ No, split the turf expense equally</span></div><Field id="session-contribution" label="Fixed contribution per person (₹)" value="250" hint="Default contribution expected from each player."/><Field id="session-total" label="Total session expenses (₹)" value="4,500" hint="Includes turf, water, balls and other costs."/><Field id="session-turf" label="Actual turf charges paid (₹)" value="4,200"/><DemoButton id="session-create" primary>Create session</DemoButton></div>}
     {step.modal==="edit-session"&&<div className="tm-guide-modal-fields"><Field id="edit-session-date" label="Date" value="19 Nov 2026"/><Field id="edit-session-venue" label="Venue" value="Titans Turf"/><div className="tm-guide-fields-two" data-tour-target="edit-session-time"><Field id="edit-session-start" label="Start time" value="09:00 PM"/><Field id="edit-session-end" label="End time" value="12:00 AM"/></div><div className="tm-guide-choice-group"><b>Contribution model</b><span className="selected">● Shared cricket fund</span></div><Field id="edit-session-contribution" label="Fixed contribution per person (₹)" value="250"/><Field id="edit-session-total" label="Total session expenses (₹)" value="4,500" hint="Includes turf, water, balls and other costs."/><Field id="edit-session-turf" label="Actual turf charges paid (₹)" value="4,200"/><DemoButton id="edit-session-save" primary>Save changes</DemoButton></div>}
     {step.modal==="delete-session"&&<div className="tm-guide-confirmation" data-tour-target="delete-session-confirm"><p>Payments recorded against this session will also be deleted.</p><small>This action cannot be undone. Keep the session if you are unsure.</small><div><DemoButton id="delete-session-cancel">Keep session</DemoButton><DemoButton id="delete-session-confirm-button" primary>Yes, delete session</DemoButton></div></div>}
     {step.modal==="delete-player"&&<div className="tm-guide-confirmation" data-tour-target="delete-player-confirm"><p>Delete Aniket from the player list?</p><small>The player will be removed from future attendance. Past sessions, payment records and reports will retain the player's name. Players with outstanding amounts cannot be deleted.</small><div><DemoButton id="delete-player-cancel">Cancel</DemoButton><DemoButton id="delete-player-confirm-button" primary>Delete player</DemoButton></div></div>}
    {step.modal==="attendance"&&<><div className="tm-guide-search" data-tour-target="attendance-search">⌕ <span>Search name or mobile</span></div><div className="tm-guide-roster" data-tour-target="attendance-roster">{demoPlayers.map((p,i)=><div className="tm-guide-roster-item" key={p.name}><span className="tm-guide-checkbox">{i<4?"✓":""}</span><span><b>{p.name}</b><small>{p.phone}</small></span></div>)}</div><div className="tm-guide-inline-action" data-tour-target="attendance-add-player">＋ Add New Player</div><DemoButton id="attendance-save" primary>Save attendance</DemoButton></>}
    {step.modal==="quick-player"&&<div className="tm-guide-modal-fields"><Field id="quick-player-name" label="Name" value="Rohan"/><Field id="quick-player-phone" label="WhatsApp number" value="9876543212"/><DemoButton id="quick-player-save" primary>Add player</DemoButton></div>}
    {step.modal==="share"&&<><div className="tm-guide-share-prompt">Session details are ready to share. Review the date, timing and player list before sending.</div><div className="tm-guide-whatsapp-preview" data-tour-target="share-message"><b>WhatsApp · Session message</b><pre>🏏 *Titans Turf*
19 Nov 2026 · 9:00 PM – 12:00 AM

Players playing:
1. Aniket
2. Ajit
3. Suhas
4. Sameet
5. Krunal
6. Mohak

Contribution: ₹250 per player</pre><div className="tm-guide-qr-placeholder">▦<small>COMMON PAYMENT QR</small></div></div><div className="tm-guide-share-actions" data-tour-target="share-actions"><DemoButton id="share-whatsapp" primary>Open WhatsApp &amp; Send</DemoButton><DemoButton id="share-qr">↓ Download payment QR</DemoButton></div><div className="tm-guide-inline-action" data-tour-target="share-skip">Skip for now</div></>}
    {step.modal==="reminder"&&<><div className="tm-guide-share-prompt" data-tour-target="reminder-message"><b>Ready for Ajit.</b><p>Pending cricket contribution · ₹250</p><small>Hi Ajit 👋 Your ₹250 contribution for Titans Turf is pending. Please scan the payment QR or use the payment link.</small></div><div className="tm-guide-modal-fields"><Field id="reminder-note" label="UPI payment note" value="TurfMate Titans Turf contribution"/><Field id="reminder-phone" label="Ajit WhatsApp number · read only" value="9876501234"/></div><div className="tm-guide-qr-placeholder">▦<small>PERSONALISED PAYMENT QR</small></div><div data-tour-target="reminder-send"><DemoButton id="reminder-whatsapp" primary>Open Ajit's WhatsApp &amp; Send</DemoButton><small className="tm-guide-disclaimer">WhatsApp will not open during this guided demo.</small></div></>}
    {step.modal==="player"&&<div className="tm-guide-modal-fields"><Field id="player-name" label="Full name" value="Rohan"/><Field id="player-phone" label="WhatsApp number" value="9876543212"/><DemoButton id="player-save" primary>Add Player</DemoButton></div>}
   </section></div>}
  </div>
  <div key={index} className="tm-guide-tooltip" ref={cardRef} style={{top:placement.top,left:placement.left,width:placement.width,visibility:positionReady?"visible":"hidden"}} data-compact={placement.compact?"true":"false"}>
   {placement.compact?<div className="tm-guide-compact"><span>🏏</span><b>Continue tutorial</b><small>{index+1}/{total}</small><button type="button" onClick={next} aria-label="Continue to next step">→</button><button type="button" onClick={onClose} aria-label="Exit tutorial">×</button></div>:<>
    <div className="tm-guide-tooltip-top"><span>🏏 TURFMATE WALKTHROUGH</span><span>STEP {index+1} OF {total}</span><button type="button" onClick={onClose} aria-label="Exit tutorial">×</button></div>
    <div className="tm-guide-progress"><span style={{width:progress+"%"}}/></div>
    <small className="tm-guide-eyebrow">{step.section}</small><h2>{step.title}</h2><p>{step.body}</p>
    <div className="tm-guide-tooltip-footer"><button type="button" className="tm-guide-exit" onClick={onClose}>Exit tour</button><div><button type="button" className="tm-guide-back" onClick={back} disabled={index===0}>← Back</button><button type="button" className="tm-guide-next" onClick={next}>{index===total-1?"Finish tour":"Continue →"}</button></div></div>
   </>}
  </div>
 </div>;
}
