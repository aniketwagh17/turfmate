import { useEffect, useState } from "react";

type TutorialStep = {
  eyebrow: string;
  title: string;
  description: string;
  detail: string;
  tab: string;
  target: string;
};

const steps: TutorialStep[] = [
  { eyebrow: "WELCOME TO TURFMATE", title: "Your organiser's quick-start guide", description: "This interactive walkthrough takes you through the main areas of TurfMate, in the order you will normally use them.", detail: "You can close the guide at any time and replay it later from the sidebar. Your sessions, players and payment records are not changed by this tutorial.", tab: "Overview", target: "[data-tutorial='nav-overview']" },
  { eyebrow: "01 · OVERVIEW", title: "Your cricket control centre", description: "The Overview gives you a quick snapshot of your cricket activity: fund balance, turf spend, collections and outstanding dues.", detail: "Recent sessions appear below the summary. Open any session to manage its players, payments and sharing actions.", tab: "Overview", target: ".stats" },
  { eyebrow: "02 · SESSIONS", title: "Create a turf session", description: "Open Sessions and choose Add session. Enter the date, venue, start/end time and total session expenses.", detail: "Enter the actual turf amount separately. TurfMate calculates the difference as additional expenses such as water and balls. Choose the contribution model and per-player amount when applicable.", tab: "Sessions", target: "[data-tutorial='nav-sessions']" },
  { eyebrow: "03 · PLAYERS IN A SESSION", title: "Select who played", description: "After creating a session, add the participating players from the session details page. You can select existing players or add a new player right there.", detail: "Save attendance when the list is correct. The player list drives the session contribution calculation and payment tracking.", tab: "Sessions", target: "[data-tutorial='nav-sessions']" },
  { eyebrow: "04 · SHARE WITH YOUR GROUP", title: "Share the session details", description: "Once players are added, TurfMate can prepare a WhatsApp group message with the session timing, player list and payment QR details.", detail: "Sharing is optional. You can skip it and return to the session later; the session and attendance remain saved.", tab: "Sessions", target: "[data-tutorial='nav-sessions']" },
  { eyebrow: "05 · PLAYER ROSTER", title: "Keep your player list organised", description: "The Players tab is your master roster. Add a player with their name and WhatsApp number, edit details when they change, or deactivate someone who no longer plays.", detail: "Removing a player from the active roster keeps their historical attendance and payment records intact.", tab: "Players", target: "[data-tutorial='nav-players']" },
  { eyebrow: "06 · PAYMENTS", title: "Record and verify contributions", description: "Use Payments to record money received from a player against a session. You can choose UPI or cash, enter a partial amount, and add a note.", detail: "Review payment history and outstanding dues before sending a reminder. Only record a payment once you have actually received it.", tab: "Payments", target: "[data-tutorial='nav-payments']" },
  { eyebrow: "07 · PAYMENT REMINDERS", title: "Follow up without confusion", description: "From player/session payment views, use the reminder action to prepare a personalised WhatsApp message and payment QR link.", detail: "Check the player name, number and amount before opening WhatsApp. TurfMate prepares the message; you remain in control of sending it.", tab: "Payments", target: "[data-tutorial='nav-payments']" },
  { eyebrow: "08 · FINANCE & FUND ACTIVITY", title: "Keep the cricket fund transparent", section: "Fund activity", description: "Finance brings together fund activity, reports and payment details. Fund activity helps you record manual contributions or withdrawals and review the running balance.", detail: "Use clear notes for manual entries so another organiser can understand why money moved in or out.", tab: "Finance", target: "[data-tutorial='nav-finance']" },
  { eyebrow: "09 · DOWNLOAD REPORTS", title: "Share a clear financial report", section: "Download reports", description: "Download reports offers two views: a detailed finance report for payment and fund reconciliation, and a quick turf summary for a compact period-wise overview.", detail: "Choose the date range before downloading. The quick summary includes only fully settled sessions, so confirm player dues and organiser advances are settled first.", tab: "Finance", target: ".finance-subnav" },
  { eyebrow: "10 · PAYMENT DETAILS", title: "Keep QR and payee information current", section: "Payment details", description: "Payment details is where you maintain the UPI ID, payee name and fund manager contact details used in payment and reminder workflows.", detail: "Review these details whenever the receiving account or fund manager changes. Make sure the details are correct before sharing a QR or reminder.", tab: "Finance", target: ".finance-subnav" },
  { eyebrow: "YOU'RE READY", title: "Run your next session with confidence", description: "The usual flow is: create session → add players → share if needed → record payments → settle the balance → download reports.", detail: "You can revisit this walkthrough whenever you need a refresher. Enjoy the game — TurfMate will help keep the accounts clear.", tab: "Overview", target: "[data-tutorial='nav-overview']" }
];

export default function OrganiserTutorial({ onClose, onComplete, onNavigate }: { onClose: () => void; onComplete: () => void; onNavigate: (tab: string, section?: string) => void }) {
  const [index, setIndex] = useState(0);
  const step = steps[index];

  useEffect(() => {
    onNavigate(step.tab, step.section);
    const frame = window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(step.target);
      target?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      target?.classList.add("tutorial-highlight");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.querySelectorAll(".tutorial-highlight").forEach(node => node.classList.remove("tutorial-highlight"));
    };
  }, [index]);

  const move = (next: number) => setIndex(Math.max(0, Math.min(steps.length - 1, next)));

  return <div className="tutorial-layer" role="dialog" aria-modal="true" aria-label="TurfMate organiser tutorial">
    <div className="tutorial-scrim" />
    <section className="tutorial-card">
      <div className="tutorial-card-top"><span>🏏 TURFMATE GUIDE</span><button type="button" aria-label="Close tutorial" onClick={onClose}>×</button></div>
      <div className="tutorial-progress"><span style={{ width: ((index + 1) / steps.length * 100) + "%" }} /></div>
      <div className="tutorial-step-meta">{step.eyebrow}</div>
      <h2>{step.title}</h2>
      <p>{step.description}</p>
      <div className="tutorial-tip"><span aria-hidden="true">✦</span><span>{step.detail}</span></div>
      <div className="tutorial-footer"><span>{index + 1} of {steps.length}</span><div>
        <button type="button" className="tutorial-secondary" onClick={() => index === 0 ? onClose() : move(index - 1)}>{index === 0 ? "Maybe later" : "Back"}</button>
        {index < steps.length - 1
          ? <button type="button" className="tutorial-primary" onClick={() => move(index + 1)}>Next step <span aria-hidden="true">→</span></button>
          : <button type="button" className="tutorial-primary" onClick={onComplete}>Finish tutorial ✓</button>}
      </div></div>
    </section>
  </div>;
}
