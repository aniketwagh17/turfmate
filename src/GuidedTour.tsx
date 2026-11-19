import { useEffect, useState } from "react";

type WalkStep = {
  section: string;
  title: string;
  body: string;
  screenTitle: string;
  rows: string[];
  focus?: string;
  action?: string;
};

const steps: WalkStep[] = [
  { section: "OVERVIEW", title: "Start from the organiser dashboard", body: "The recording begins on Overview. This is the organiser's home screen, with the cricket fund, turf spend, collections and recent sessions at a glance. Tap Add session to start a new booking.", screenTitle: "Overview", rows: ["Good game. Clear accounts.", "Cricket fund  ₹13,364", "Total turf spend  ₹0", "Collected  ₹0", "Recent sessions"], focus: "＋ Add session", action: "Add session" },
  { section: "CREATE SESSION", title: "The Turf info form", body: "Add session opens the Turf info form. The recording shows the booking date, venue, start and end time, followed by the contribution model and expense details.", screenTitle: "Turf info", rows: ["Date  ·  20 Nov 2026", "Venue  ·  Titans Turf", "Start time  ·  21:00", "End time  ·  00:00", "Does your group maintain a cricket fund?", "● Yes, we maintain a shared cricket fund", "○ No, split the turf expense equally"], focus: "Turf info" },
  { section: "CREATE SESSION", title: "Choose the session date", body: "The date picker opens from the Date field. Select the day the group has booked the turf. In the recording, the selected date is 20 November 2026.", screenTitle: "Choose date", rows: ["November 2026", "Thu 19     Fri 20     Sat 21", "Selected · 20 Nov 2026"], focus: "Date · 20 Nov 2026" },
  { section: "CREATE SESSION", title: "Set the playing time", body: "Set both ends of the booking slot. The recording uses a 9:00 PM start and a 12:00 AM end. The time picker is the phone's native time control.", screenTitle: "Turf info · Time", rows: ["Start time  ·  09:00 PM", "End time  ·  12:00 AM", "Booking duration  ·  3 hours"], focus: "Start time / End time" },
  { section: "CREATE SESSION", title: "Choose the contribution model", body: "TurfMate asks whether the group maintains a shared cricket fund. The recording keeps the shared fund option selected. Choosing the other option switches to an equal split of the turf expense.", screenTitle: "Contribution model", rows: ["Does your group maintain a cricket fund?", "● Yes, we maintain a shared cricket fund", "○ No, split the turf expense equally"], focus: "Shared cricket fund" },
  { section: "CREATE SESSION", title: "Set the fixed contribution", body: "With the shared fund enabled, enter the expected contribution per person. The recording keeps the default amount at ₹250. Any shortfall is tracked as an organiser advance; surplus goes to the cricket fund.", screenTitle: "Turf info", rows: ["Fixed contribution per person (₹)", "250", "Default contribution expected from each player.", "Any session shortfall is tracked as an organiser advance."], focus: "₹250 contribution" },
  { section: "CREATE SESSION", title: "Enter total session expenses", body: "Enter the complete session cost here, including turf, water, balls and other expenses. In the recording, the total is ₹4,500.", screenTitle: "Turf info", rows: ["Total session expenses (₹)", "4,500", "Includes turf, water, balls and other costs."], focus: "₹4,500 total expenses" },
  { section: "CREATE SESSION", title: "Separate actual turf charges", body: "Actual turf charges are recorded separately from the full session expense. The recording shows ₹4,200 paid to the turf and ₹300 in additional expenses such as water or balls.", screenTitle: "Turf info", rows: ["Total session expenses  ·  ₹4,500", "Actual turf charges paid (₹)  ·  4,200", "Additional expenses · water / balls etc.  ·  ₹300"], focus: "Actual turf charges · ₹4,200" },
  { section: "CREATE SESSION", title: "Create the session", body: "Review the expense split, then tap Create session. This is the point where the booking is saved and TurfMate opens the new session workspace.", screenTitle: "Turf info", rows: ["Date  ·  20 Nov 2026", "Venue  ·  Titans Turf", "9:00 PM – 12:00 AM", "Total expenses  ·  ₹4,500", "Turf charges  ·  ₹4,200", "Additional expenses  ·  ₹300"], focus: "Create session", action: "Create session" },
  { section: "SESSION CREATED", title: "Your session is ready", body: "TurfMate confirms that the session was created. The session workspace now shows the booking and the next organiser actions. The recording moves straight to Manage players.", screenTitle: "Session created", rows: ["✓ Session created", "Add the players attending, then share the session details whenever you are ready.", "Titans Turf  ·  20 Nov 2026", "Cricket fund reconciliation", "Manage players", "Manage payments"], focus: "Manage players" },
  { section: "MANAGE SESSION PLAYERS", title: "Open Manage session players", body: "Manage players opens the attendance picker for this booking. This is session attendance, not the master Players directory. At first, the recording shows an empty roster.", screenTitle: "Manage session players", rows: ["0 selected", "No players added yet", "Add your first players to this session.", "＋ Add New Player", "Save attendance"], focus: "＋ Add New Player" },
  { section: "MANAGE SESSION PLAYERS", title: "Add a player from the session", body: "Tap Add New Player to reveal the quick-add form without leaving the attendance picker. You can enter a name and WhatsApp number, then add that person to the roster.", screenTitle: "Manage session players", rows: ["Add a player to the roster", "Name", "WhatsApp number", "Cancel       Add player"], focus: "Add a player to the roster" },
  { section: "MANAGE SESSION PLAYERS", title: "Enter the player's details", body: "The recording adds players directly inside this modal. It enters Aniket first, then adds Ajit as the second player. A valid mobile number is required before adding.", screenTitle: "Add a player to the roster", rows: ["Name  ·  Aniket", "WhatsApp number  ·  10-digit mobile", "Cancel       Add player"], focus: "Name and WhatsApp number" },
  { section: "MANAGE SESSION PLAYERS", title: "Add the next player", body: "The same quick-add form can be used again. The recording adds Ajit, so the session roster now contains two selected players.", screenTitle: "Manage session players", rows: ["2 selected", "Aniket", "Ajit", "＋ Add New Player", "Save attendance"], focus: "Ajit added to the roster" },
  { section: "MANAGE SESSION PLAYERS", title: "Save attendance", body: "Once the required players are selected, tap Save attendance. TurfMate closes the picker and returns to the session workspace with the attendance saved.", screenTitle: "Manage session players", rows: ["2 selected", "Aniket     ✓", "Ajit       ✓", "＋ Add New Player", "Save attendance"], focus: "Save attendance", action: "Save attendance" },
  { section: "PLAYERS DIRECTORY", title: "The Players tab is the master roster", body: "The recording then opens Players. This is different from Manage session players: it is the group's reusable player directory, not attendance for one booking.", screenTitle: "Players", rows: ["Players", "Manage your player list", "Search name or mobile", "Show  ·  All Players", "Aniket", "Ajit"], focus: "Players directory" },
  { section: "PLAYERS DIRECTORY", title: "Register a player", body: "Add Player opens the Register Player form from the main directory. Use this when you want to add someone to the group's master roster, independently of a particular session.", screenTitle: "Register Player", rows: ["Full Name", "WhatsApp number", "10-digit mobile number", "Add Player"], focus: "Register Player" },
  { section: "PLAYERS DIRECTORY", title: "Enter and save player details", body: "Enter the player's full name and WhatsApp number, then tap Add Player. The recording shows the form being completed; this first prototype stops here so you can review the create-session and player-management journey.", screenTitle: "Register Player", rows: ["Full Name  ·  Suresh", "WhatsApp number  ·  10-digit mobile", "Add Player"], focus: "Add Player", action: "Add Player" }
];

export default function GuidedTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const step = steps[index];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex(value => Math.min(steps.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex(value => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="tm-video-tour" role="dialog" aria-modal="true" aria-label="TurfMate video-based walkthrough">
      <style>{`
        .tm-video-tour{position:fixed;inset:0;z-index:30000;display:grid;grid-template-columns:minmax(260px,1fr) minmax(300px,420px);gap:clamp(18px,4vw,54px);align-items:center;justify-content:center;padding:clamp(16px,4vw,54px);overflow:auto;background:radial-gradient(circle at 20% 20%,#254d37 0,#14271d 42%,#09130d 100%);color:#f6fff8;font-family:Inter,system-ui,sans-serif}
        .tm-video-tour *{box-sizing:border-box}
        .tm-video-preview-wrap{display:flex;justify-content:center;align-items:center;min-width:0}
        .tm-video-phone{width:min(100%,340px);max-height:min(78vh,780px);aspect-ratio:9/19.4;padding:9px;border:1px solid #6b8c76;border-radius:32px;background:#070d09;box-shadow:0 24px 90px #0009,0 0 0 6px #ffffff0a;overflow:hidden}
        .tm-video-screen{height:100%;display:flex;flex-direction:column;overflow:hidden;border-radius:23px;background:#f5f7f6;color:#24362c}
        .tm-video-status{height:25px;flex:0 0 25px;display:flex;justify-content:space-between;align-items:center;padding:0 13px;background:#10251a;color:#fff;font-size:9px;font-weight:700}
        .tm-video-appbar{padding:13px 15px 11px;background:#fff;border-bottom:1px solid #e5ece7}
        .tm-video-appbar small{display:block;color:#8a978e;font-size:7px;letter-spacing:.08em;font-weight:800}
        .tm-video-appbar b{display:block;margin-top:5px;color:#213b2c;font-size:15px}
        .tm-video-content{flex:1;overflow:auto;padding:13px 12px 18px}
        .tm-video-row{margin-bottom:8px;padding:10px 11px;border:1px solid #e1e9e4;border-radius:10px;background:#fff;color:#52655a;font-size:10px;line-height:1.45;white-space:pre-line}
        .tm-video-row.focus{border:2px solid #25a76a;background:#effbf4;box-shadow:0 0 0 3px #25a76a20;color:#145a37;font-weight:800}
        .tm-video-primary{display:block;width:100%;margin-top:10px;padding:12px;border:0;border-radius:9px;background:#159765;color:white;text-align:center;font-size:11px;font-weight:850}
        .tm-video-nav{display:flex;justify-content:space-around;padding:10px 3px;background:#fff;border-top:1px solid #e5ece7;color:#839188;font-size:8px}
        .tm-video-copy{width:100%;max-width:420px;margin:auto}
        .tm-video-kicker{display:flex;align-items:center;gap:8px;color:#91e3b2;font-size:9px;font-weight:900;letter-spacing:.14em}
        .tm-video-kicker span{margin-left:auto;color:#c0d4c7;letter-spacing:0}
        .tm-video-progress{height:5px;margin:15px 0 24px;border-radius:8px;background:#31483a;overflow:hidden}
        .tm-video-progress span{display:block;height:100%;background:#55d18c;transition:width .2s}
        .tm-video-copy h1{margin:9px 0 12px;font-size:clamp(23px,4vw,32px);line-height:1.14;letter-spacing:-.04em}
        .tm-video-copy p{margin:0;color:#c6d8cc;font-size:13px;line-height:1.7}
        .tm-video-focus-note{margin-top:18px;padding:12px 14px;border:1px solid #46634f;border-radius:12px;background:#1b3425;color:#a7e8bd;font-size:11px;font-weight:800}
        .tm-video-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:28px}
        .tm-video-actions button{min-height:43px;padding:0 14px;border:1px solid #55725e;border-radius:10px;background:#20382a;color:#e7f5eb;font-size:11px;font-weight:800}
        .tm-video-actions button:disabled{opacity:.35}
        .tm-video-actions .next{border-color:#68d99a;background:#55d18c;color:#092014}
        .tm-video-stepcount{margin-top:14px;color:#9fb4a5;font-size:10px}
        .tm-video-close{position:fixed;top:16px;right:18px;width:38px;height:38px;border:1px solid #55725e;border-radius:50%;background:#1b3425;color:white;font-size:22px}
        .tm-video-mobile-hint{display:none}
        @media(max-width:760px){.tm-video-tour{grid-template-columns:1fr;grid-template-rows:minmax(230px,44vh) auto;gap:12px;padding:56px 16px 18px;align-items:start}.tm-video-phone{width:min(64vw,270px);max-height:42vh;padding:6px;border-radius:24px}.tm-video-screen{border-radius:18px}.tm-video-status{height:18px;flex-basis:18px}.tm-video-appbar{padding:8px 10px}.tm-video-appbar b{font-size:12px}.tm-video-content{padding:8px}.tm-video-row{margin-bottom:5px;padding:7px 8px;font-size:8px}.tm-video-primary{padding:8px;font-size:9px}.tm-video-nav{padding:7px 2px;font-size:7px}.tm-video-copy{max-width:520px}.tm-video-progress{margin:10px 0 14px}.tm-video-copy h1{font-size:22px;margin:5px 0 8px}.tm-video-copy p{font-size:11px;line-height:1.5}.tm-video-focus-note{margin-top:10px;padding:9px 11px}.tm-video-actions{margin-top:15px}.tm-video-actions button{min-height:38px;padding:0 11px;font-size:10px}.tm-video-stepcount{margin-top:8px}.tm-video-close{top:10px;right:10px;width:32px;height:32px}}
        @media(max-height:700px) and (max-width:760px){.tm-video-tour{grid-template-rows:minmax(190px,38vh) auto}.tm-video-phone{max-height:36vh}.tm-video-copy p{max-height:85px;overflow:auto}}
      `}</style>
      <button type="button" className="tm-video-close" onClick={onClose} aria-label="Close walkthrough">×</button>
      <div className="tm-video-preview-wrap">
        <div className="tm-video-phone">
          <div className="tm-video-screen">
            <div className="tm-video-status"><span>11:10</span><span>● ● ●  4G  ▰</span></div>
            <div className="tm-video-appbar"><small>MANHATTAN CRICKET / {step.section}</small><b>{step.screenTitle}</b></div>
            <div className="tm-video-content">
              {step.rows.map((row, rowIndex) => <div key={rowIndex} className={"tm-video-row" + (step.focus === row || (step.focus && row.includes(step.focus)) ? " focus" : "")}>{row}</div>)}
              {step.action && <div className="tm-video-primary">{step.action}</div>}
            </div>
            <div className="tm-video-nav"><span>⌂ Home</span><span>▦ Sessions</span><span>♙ Players</span><span>₹ Payments</span><span>▤ Finance</span></div>
          </div>
        </div>
      </div>
      <section className="tm-video-copy">
        <div className="tm-video-kicker">🏏 TURFMATE · VIDEO WALKTHROUGH <span>{progress}%</span></div>
        <div className="tm-video-progress"><span style={{ width: progress + "%" }} /></div>
        <small style={{ color: "#8ee1ae", fontSize: 9, fontWeight: 900, letterSpacing: ".13em" }}>{step.section}</small>
        <h1>{step.title}</h1>
        <p>{step.body}</p>
        {step.focus && <div className="tm-video-focus-note">LOOK HERE · {step.focus}</div>}
        <div className="tm-video-actions">
          <button type="button" onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}>← Back</button>
          <button type="button" onClick={onClose}>Exit</button>
          <button type="button" className="next" onClick={() => index === steps.length - 1 ? onClose() : setIndex(value => value + 1)}>{index === steps.length - 1 ? "Finish" : "Continue →"}</button>
        </div>
        <div className="tm-video-stepcount">Step {index + 1} of {steps.length} · Use ← → on keyboard too</div>
      </section>
    </div>
  );
}
