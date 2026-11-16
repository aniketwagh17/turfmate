import { useEffect, useState, type CSSProperties } from "react";

type TutorialStep = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  tab: string;
  target: string;
  fallback: string;
  section?: string;
};

const steps: TutorialStep[] = [
  { eyebrow: "WELCOME", title: "Welcome to TurfMate", description: "I'll walk you through the actual screens you will use to organise your cricket group.", detail: "The highlighted area is the part we're discussing. Use Next to move through the app. You can skip the guide at any time; it never changes your records.", tab: "Overview", target: ".tutorial-header-launch", fallback: "[data-tutorial='nav-overview']" },
  { eyebrow: "01 · OVERVIEW", title: "Start from your cricket dashboard", description: "This is your quick snapshot of the group: cricket fund, turf spend, collections and outstanding dues.", detail: "These figures update as you add sessions and record payments. Recent sessions appear underneath.", tab: "Overview", target: "[data-tutorial='overview-stats']", fallback: ".hero" },
  { eyebrow: "02 · CREATE A SESSION", title: "Add your turf booking", description: "Tap Add session to enter the date, venue, timing and total expenses for the booking.", detail: "Enter the actual turf charge separately. TurfMate works out additional costs such as water and balls. Choose the contribution model for the group.", tab: "Sessions", target: "[data-tutorial='create-session']", fallback: ".pagehead" },
  { eyebrow: "03 · ADD PLAYERS", title: "Choose who played", description: "After creating a session, open that session and use Add players to select the people who attended.", detail: "You can select players already in your roster or add a new player from the same screen. If this is a brand-new workspace, create your first session before this action becomes available.", tab: "Sessions", target: "[data-tutorial='session-add-players']", fallback: "[data-tutorial='create-session']" },
  { eyebrow: "04 · SHARE THE SESSION", title: "Send the session to your group", description: "On a session's detail screen, Share session & player list prepares the WhatsApp message and payment QR details.", detail: "Sharing is optional. You can skip it and return to the session later. This action appears after a session has players, so create a session and add attendance first.", tab: "Session details", target: "[data-tutorial='share-session']", fallback: "[data-tutorial='create-session']" },
  { eyebrow: "05 · PLAYER ROSTER", title: "Maintain your player list", description: "Players is your master roster. Add a player, update their name or WhatsApp number, and remove players who no longer play.", detail: "Removing a player from the active roster does not erase their historical session or payment records.", tab: "Players", target: "[data-tutorial='add-player']", fallback: ".pagehead" },
  { eyebrow: "06 · RECORD PAYMENTS", title: "Record money received", description: "In Payments, select the session and player, enter the amount received, and choose UPI or cash.", detail: "You can record partial payments too. Only record money after it has actually reached the organiser. The payment history appears beside the form.", tab: "Payments", target: "[data-tutorial='payment-form']", fallback: ".pagehead" },
  { eyebrow: "07 · SEND REMINDERS", title: "Follow up on pending dues", description: "Use the payment reminder action from the player or session payment view to prepare a personal WhatsApp message.", detail: "Check the player, phone number and amount before opening WhatsApp. TurfMate prepares the message and QR link; you decide whether to send it.", tab: "Players", target: "[data-tutorial='player-reminder']", fallback: "[data-tutorial='add-player']" },
  { eyebrow: "08 · FINANCE", title: "Keep the cricket fund transparent", description: "Finance brings together fund activity, downloadable reports and the organiser's payment details.", detail: "If your group maintains a shared fund, use Fund activity to record manual contributions or withdrawals with a clear note.", tab: "Finance", target: ".finance-subnav", fallback: ".pagehead", section: "Fund activity" },
  { eyebrow: "09 · REPORTS", title: "Download your cricket reports", description: "Choose Download reports to create either a detailed finance report or a compact turf summary PDF.", detail: "Select the date range first. The quick turf summary includes only fully settled sessions, so clear player dues and organiser advances before relying on it.", tab: "Finance", target: "[data-tutorial='report-panel']", fallback: ".finance-subnav", section: "Download reports" },
  { eyebrow: "10 · PAYMENT DETAILS", title: "Keep QR and payee details correct", description: "Payment details contains the payee name, UPI ID and cricket fund manager contact information used by payment and reminder flows.", detail: "Update these whenever the receiving account or fund manager changes. Always verify the details before sharing a QR code.", tab: "Finance", target: "[data-tutorial='payee-panel']", fallback: ".finance-subnav", section: "Payment details" },
  { eyebrow: "YOU'RE READY", title: "That's the organiser workflow", description: "Create a session → add players → share if needed → record payments → settle balances → download reports.", detail: "You can replay this guide any time from the Guide button. Have a great game!", tab: "Overview", target: "[data-tutorial='create-session']", fallback: ".hero" }
];

export default function OrganiserTutorial({ onClose, onComplete, onNavigate }: { onClose: () => void; onComplete: () => void; onNavigate: (tab: string, section?: string) => void }) {
  const [index, setIndex] = useState(0);
  const [cardStyle, setCardStyle] = useState<CSSProperties>({});
  const step = steps[index];

  useEffect(() => {
    onNavigate(step.tab, step.section);
    let frame = 0;
    let attempts = 0;
    let activeTarget: HTMLElement | null = null;
    const placeCard = (target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      if (window.innerWidth <= 760) {
        setCardStyle({ left: 12, right: 12, bottom: "max(12px, env(safe-area-inset-bottom))" });
      } else {
        const width = 370;
        const left = rect.right + width + 24 < window.innerWidth ? rect.right + 18 : Math.max(16, rect.left - width - 18);
        const estimatedHeight = 360;
        const top = Math.max(16, Math.min(window.innerHeight - estimatedHeight - 16, rect.top + rect.height / 2 - estimatedHeight / 2));
        setCardStyle({ left, top, width });
      }
    };
    const locate = () => {
      attempts += 1;
      const target = document.querySelector<HTMLElement>(step.target) || document.querySelector<HTMLElement>(step.fallback);
      if (target) {
        activeTarget = target;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        target.classList.add("tutorial-focus");
        window.setTimeout(() => { if (activeTarget) placeCard(activeTarget); }, 220);
      } else if (attempts < 12) {
        frame = window.requestAnimationFrame(locate);
      }
    };
    frame = window.requestAnimationFrame(locate);
    const onResize = () => { if (activeTarget) placeCard(activeTarget); };
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.querySelectorAll(".tutorial-focus").forEach(node => node.classList.remove("tutorial-focus"));
    };
  }, [index]);

  const move = (next: number) => setIndex(Math.max(0, Math.min(steps.length - 1, next)));

  return <div className="tutorial-layer" role="dialog" aria-modal="true" aria-label="TurfMate organiser tutorial">
    <div className="tutorial-scrim" />
    <section className="tutorial-card" style={cardStyle}>
      <div className="tutorial-card-top"><span>🏏 TURFMATE · ORGANISER GUIDE</span><button type="button" aria-label="Skip tutorial" onClick={onClose}>×</button></div>
      <div className="tutorial-progress"><span style={{ width: ((index + 1) / steps.length * 100) + "%" }} /></div>
      <div className="tutorial-step-meta">STEP {index + 1} OF {steps.length} · {step.eyebrow}</div>
      <h2>{step.title}</h2>
      <p>{step.description}</p>
      <div className="tutorial-tip"><span aria-hidden="true">✦</span><span>{step.detail}</span></div>
      <div className="tutorial-footer"><button type="button" className="tutorial-skip" onClick={onClose}>Skip guide</button><div>
        <button type="button" className="tutorial-secondary" onClick={() => index === 0 ? onClose() : move(index - 1)}>{index === 0 ? "Close" : "Back"}</button>
        {index < steps.length - 1
          ? <button type="button" className="tutorial-primary" onClick={() => move(index + 1)}>Next <span aria-hidden="true">→</span></button>
          : <button type="button" className="tutorial-primary" onClick={onComplete}>Finish ✓</button>}
      </div></div>
    </section>
  </div>;
}
