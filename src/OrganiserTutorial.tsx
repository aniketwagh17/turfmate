import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

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
  { eyebrow: "WELCOME", title: "Welcome to TurfMate", description: "This guide points out the real controls you will use to run your cricket sessions.", detail: "Follow the highlighted area. Use Next and Back to move around, or Skip guide whenever you like.", tab: "Overview", target: "[data-tutorial='overview-stats']", fallback: "[data-tutorial='nav-overview']" },
  { eyebrow: "01 · OVERVIEW", title: "Your cricket dashboard", description: "A quick snapshot of your group's fund, turf spending, collections and pending dues.", detail: "These figures update as you create sessions and record payments.", tab: "Overview", target: "[data-tutorial='overview-stats']", fallback: "[data-tutorial='nav-overview']" },
  { eyebrow: "02 · CREATE A SESSION", title: "Create your turf booking", description: "Start here to enter the booking date, venue, time and session expenses.", detail: "Add the actual turf charge and any extra costs, such as water or balls. Choose how the contribution is split.", tab: "Sessions", target: "[data-tutorial='create-session']", fallback: "[data-tutorial='nav-sessions']" },
  { eyebrow: "03 · ADD PLAYERS", title: "Add the players who attended", description: "Open a session and use Add players to mark who joined that game.", detail: "Choose existing players or add someone new. If no session exists yet, the highlighted Sessions tab takes you back to the first step.", tab: "Sessions", target: "[data-tutorial='session-add-players']", fallback: "[data-tutorial='nav-sessions']" },
  { eyebrow: "04 · SHARE THE SESSION", title: "Share details with your group", description: "The session detail screen prepares a WhatsApp message with the player list and payment information.", detail: "Sharing is optional. This action appears once a session has been created; you can return to it later.", tab: "Session details", target: "[data-tutorial='share-session']", fallback: "[data-tutorial='nav-sessions']" },
  { eyebrow: "05 · PLAYER ROSTER", title: "Maintain your player list", description: "The Players area is your master roster. Add players and update their names or contact numbers here.", detail: "Your past session and payment history remains available even if a player is removed from the active roster.", tab: "Players", target: "[data-tutorial='add-player']", fallback: "[data-tutorial='nav-players']" },
  { eyebrow: "06 · RECORD PAYMENTS", title: "Record money received", description: "Choose a session and player, enter the amount received, and select UPI or cash.", detail: "Partial payments are supported. Record money only after it has actually reached the organiser.", tab: "Payments", target: "[data-tutorial='payment-form']", fallback: "[data-tutorial='nav-payments']" },
  { eyebrow: "07 · SEND REMINDERS", title: "Follow up on pending dues", description: "Use the reminder action to prepare a personal WhatsApp message for a player.", detail: "Check the player's number and amount before opening WhatsApp. You stay in control of sending the message.", tab: "Players", target: "[data-tutorial='player-reminder']", fallback: "[data-tutorial='nav-players']" },
  { eyebrow: "08 · FINANCE", title: "Track your cricket fund", description: "Finance brings together fund activity, reports and the payment details used by your group.", detail: "Use Fund activity to record manual fund contributions or withdrawals with a clear note.", tab: "Finance", target: ".finance-subnav", fallback: "[data-tutorial='nav-finance']", section: "Fund activity" },
  { eyebrow: "09 · REPORTS", title: "Download your reports", description: "Open Download reports to create a detailed finance report or a compact turf summary PDF.", detail: "The quick summary includes fully settled sessions. Clear dues and organiser advances before relying on it.", tab: "Finance", target: "[data-tutorial='report-panel']", fallback: "[data-tutorial='nav-finance']", section: "Download reports" },
  { eyebrow: "10 · PAYMENT DETAILS", title: "Check your payee and QR details", description: "Payment details stores the payee name, UPI ID and fund manager contact used in payment flows.", detail: "Keep these details current and verify them before sharing a QR code or reminder.", tab: "Finance", target: "[data-tutorial='payee-panel']", fallback: "[data-tutorial='nav-finance']", section: "Payment details" },
  { eyebrow: "YOU'RE READY", title: "Your organiser workflow", description: "Create a session → add players → share if needed → record payments → settle balances → download reports.", detail: "Replay this guide any time from the Guide button. Have a great game!", tab: "Overview", target: "[data-tutorial='create-session']", fallback: "[data-tutorial='nav-overview']" }
];

export default function OrganiserTutorial({ onClose, onComplete, onNavigate }: { onClose: () => void; onComplete: () => void; onNavigate: (tab: string, section?: string) => void }) {
  const [index, setIndex] = useState(0);
  const [cardStyle, setCardStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const cardRef = useRef<HTMLElement>(null);
  const step = steps[index];

  useEffect(() => {
    onNavigate(step.tab, step.section);
    let frame = 0;
    let attempts = 0;
    let activeTarget: HTMLElement | null = null;
    let cancelled = false;

    const placeCard = () => {
      const target = activeTarget;
      const card = cardRef.current;
      if (!target || !card || cancelled) return;
      const targetRect = target.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const margin = 12;
      const gap = 14;
      let left: number;
      let top: number;

      if (window.innerWidth <= 760) {
        left = margin;
        const width = Math.min(360, window.innerWidth - margin * 2);
        const below = window.innerHeight - targetRect.bottom - gap;
        const above = targetRect.top - gap;
        top = below >= cardRect.height || below >= above
          ? Math.min(window.innerHeight - cardRect.height - margin, targetRect.bottom + gap)
          : Math.max(margin, targetRect.top - cardRect.height - gap);
        left = Math.max(margin, (window.innerWidth - width) / 2);
      } else {
        const width = Math.min(370, window.innerWidth - 32);
        left = targetRect.right + width + gap <= window.innerWidth - margin
          ? targetRect.right + gap
          : Math.max(margin, targetRect.left - width - gap);
        top = Math.max(margin, Math.min(window.innerHeight - cardRect.height - margin, targetRect.top + targetRect.height / 2 - cardRect.height / 2));
      }

      setCardStyle({ position: "fixed", left, top, width: window.innerWidth <= 760 ? Math.min(360, window.innerWidth - 24) : 370, visibility: "visible" });
    };

    const locate = () => {
      if (cancelled) return;
      attempts += 1;
      const target = document.querySelector<HTMLElement>(step.target) || document.querySelector<HTMLElement>(step.fallback);
      if (target) {
        activeTarget = target;
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        target.classList.add("tutorial-focus");
        window.setTimeout(placeCard, 280);
        frame = window.requestAnimationFrame(placeCard);
      } else if (attempts < 20) {
        frame = window.requestAnimationFrame(locate);
      }
    };

    frame = window.requestAnimationFrame(locate);
    const onViewportChange = () => placeCard();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      document.querySelectorAll(".tutorial-focus").forEach(node => node.classList.remove("tutorial-focus"));
    };
  }, [index]);

  const move = (next: number) => setIndex(Math.max(0, Math.min(steps.length - 1, next)));

  return createPortal(
    <div className="tutorial-layer" role="dialog" aria-modal="true" aria-label="TurfMate organiser tutorial">
      <div className="tutorial-scrim" />
      <section ref={cardRef} className="tutorial-card" style={cardStyle}>
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
    </div>,
    document.body
  );
}
