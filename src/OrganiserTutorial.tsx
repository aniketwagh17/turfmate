import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type Step = {
  target: string;
  title: string;
  body: string;
  hint: string;
  complete: (event: Event) => boolean;
};

const steps: Step[] = [
  {
    target: "[data-tutorial='create-session']",
    title: "Start with Add session",
    body: "Let's create a real-looking practice session inside a temporary demo workspace. Your saved TurfMate sessions and finance records are kept untouched.",
    hint: "Tap + Add session in the app.",
    complete: event => event.type === "click" && !!(event.target as HTMLElement | null)?.closest("[data-tutorial='create-session']")
  },
  {
    target: "[data-tutorial='session-form-save']",
    title: "Fill in the session details",
    body: "Use the open Turf info form just as you normally would: enter the date, venue, start and end times, choose the contribution model, then enter total expenses and actual turf charges.",
    hint: "Complete the form and tap Create session. This guide waits for the real form submission.",
    complete: event => event.type === "submit" && !!(event.target as HTMLElement | null)?.closest(".modal")
  },
  {
    target: "[data-tutorial='session-add-players']",
    title: "Add players to this session",
    body: "Your session now exists in the practice workspace. Choose Add players to record who is attending.",
    hint: "Tap Add players on the session details screen.",
    complete: event => event.type === "click" && !!(event.target as HTMLElement | null)?.closest("[data-tutorial='session-add-players']")
  },
  {
    target: "[data-tutorial='add-new-player']",
    title: "Add a sample player",
    body: "You can select people already in your roster, or add someone new from this same screen. For this walkthrough, we'll add one sample player.",
    hint: "Tap Add New Player inside the Add players window.",
    complete: event => event.type === "click" && !!(event.target as HTMLElement | null)?.closest("[data-tutorial='add-new-player']")
  },
  {
    target: "[data-tutorial='quick-player-save']",
    title: "Save the sample player",
    body: "Enter a sample name and a valid 10-digit test mobile number. This creates a demo player only; it won't message anyone.",
    hint: "Fill both fields, then tap Add player.",
    complete: event => event.type === "click" && !!(event.target as HTMLElement | null)?.closest("[data-tutorial='quick-player-save']")
  },
  {
    target: "[data-tutorial='save-attendance']",
    title: "Save session attendance",
    body: "The new sample player is selected automatically. You can select any other sample attendees too. Check the list before saving.",
    hint: "Tap Save attendance to complete the actual session workflow.",
    complete: event => event.type === "submit" && !!(event.target as HTMLElement | null)?.closest(".modal")
  },
  {
    target: ".whatsapp-preview",
    title: "Review the group message",
    body: "TurfMate has prepared the real session announcement and payment QR preview using your demo session. Nothing will be sent to WhatsApp in this practice walkthrough.",
    hint: "Review the preview, then close it or tap Skip for now. Your real workspace will be restored automatically.",
    complete: event => event.type === "click" && !!(event.target as HTMLElement | null)?.closest(".skip-share-button, .modal-close-button")
  }
];

export default function OrganiserTutorial({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });
  const card = useRef<HTMLElement>(null);
  const step = steps[index];

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let tries = 0;
    let target: HTMLElement | null = null;

    const place = () => {
      if (cancelled || !target || !card.current) return;
      const rect = target.getBoundingClientRect();
      const cardRect = card.current.getBoundingClientRect();
      const margin = 12;
      const gap = 14;
      const mobile = window.innerWidth <= 760;
      const width = mobile ? Math.min(340, window.innerWidth - 24) : 340;
      let left: number;
      let top: number;

      if (mobile) {
        left = Math.max(margin, (window.innerWidth - width) / 2);
        const roomBelow = window.innerHeight - rect.bottom - gap;
        const roomAbove = rect.top - gap;
        top = roomBelow >= cardRect.height || roomBelow >= roomAbove
          ? Math.min(window.innerHeight - cardRect.height - margin, rect.bottom + gap)
          : Math.max(margin, rect.top - cardRect.height - gap);
      } else {
        left = rect.right + width + gap + margin <= window.innerWidth
          ? rect.right + gap
          : Math.max(margin, rect.left - width - gap);
        top = Math.max(margin, Math.min(window.innerHeight - cardRect.height - margin, rect.top + rect.height / 2 - cardRect.height / 2));
      }
      setStyle({ position: "fixed", left, top, width, visibility: "visible" });
    };

    const locate = () => {
      if (cancelled) return;
      tries += 1;
      target = document.querySelector<HTMLElement>(step.target);
      if (target) {
        target.classList.add("tutorial-focus");
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        window.setTimeout(place, 220);
        frame = requestAnimationFrame(place);
      } else if (tries < 50) {
        frame = requestAnimationFrame(locate);
      }
    };

    frame = requestAnimationFrame(locate);
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    const observer = new ResizeObserver(reposition);
    if (card.current) observer.observe(card.current);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.querySelectorAll(".tutorial-focus").forEach(element => element.classList.remove("tutorial-focus"));
    };
  }, [index, step.target]);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      if (!step.complete(event)) return;
      if (index === steps.length - 1) onClose();
      else setIndex(current => Math.min(steps.length - 1, current + 1));
    };
    document.addEventListener("click", handleProgress);
    document.addEventListener("submit", handleProgress);
    return () => {
      document.removeEventListener("click", handleProgress);
      document.removeEventListener("submit", handleProgress);
    };
  }, [index, onClose, step]);

  return createPortal(
    <div className="tutorial-layer" role="dialog" aria-modal="false" aria-label="TurfMate guided practice">
      <div className="tutorial-scrim" />
      <section ref={card} className="tutorial-card tutorial-coach" style={style}>
        <div className="tutorial-card-top">
          <span>🏏 TURFMATE · LIVE PRACTICE</span>
          <button type="button" aria-label="Close guide" onClick={onClose}>×</button>
        </div>
        <div className="tutorial-progress"><span style={{ width: ((index + 1) / steps.length * 100) + "%" }} /></div>
        <div className="tutorial-step-meta">STEP {index + 1} OF {steps.length}</div>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="tutorial-tip"><span>✦</span><span>{step.hint}</span></div>
        <div className="tutorial-footer">
          <span className="tutorial-live-status">Complete this action to continue</span>
          <button type="button" className="tutorial-skip" onClick={onClose}>Exit guide</button>
        </div>
      </section>
    </div>,
    document.body
  );
}
