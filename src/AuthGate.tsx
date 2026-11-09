import { FormEvent, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard";

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!session) {
        setPhoneSaved(false);
        setWhatsappPhone("");
        return;
      }
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("whatsapp_phone")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setMessage("We couldn't load your profile. Please refresh and try again.");
        setPhoneSaved(false);
      } else if (data?.whatsapp_phone) {
        setWhatsappPhone(data.whatsapp_phone);
        setPhoneSaved(true);
      } else {
        setPhoneSaved(false);
      }
      setProfileLoading(false);
    }
    loadProfile();
    return () => { active = false; };
  }, [session]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setMessage(data.session ? "Account created. You are signed in." : "Account created. Check your email to confirm your address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function saveWhatsappPhone(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const normalized = whatsappPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(normalized)) {
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true); setMessage("");
    const { error } = await supabase
      .from("profiles")
      .update({ whatsapp_phone: normalized })
      .eq("id", session.user.id);
    setBusy(false);
    if (error) {
      setMessage("Couldn't save your WhatsApp number. Please try again.");
      return;
    }
    setWhatsappPhone(normalized);
    setPhoneSaved(true);
  }

  if (loading || (session && profileLoading)) return <div className="auth-screen"><div className="auth-card">Loading TurfMate…</div></div>;

  if (session && !phoneSaved) {
    return <div className="auth-screen"><form className="auth-card" onSubmit={saveWhatsappPhone}>
      <div className="auth-brand">🏏 <span>TurfMate</span></div>
      <p className="auth-subtitle">MANHATTAN CRICKET</p>
      <h1>One last thing</h1>
      <p className="auth-copy">Add your WhatsApp number so your cricket organiser can send you personalized session and payment messages from TurfMate. You only need to add this once.</p>
      <label>WhatsApp number
        <input type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} required value={whatsappPhone} onChange={e=>setWhatsappPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210"/>
      </label>
      <p className="auth-copy">Enter your 10-digit Indian mobile number. We’ll add the country code when creating WhatsApp links.</p>
      {message && <p className="auth-message" role="status">{message}</p>}
      <button className="primary auth-submit" disabled={busy}>{busy ? "Saving…" : "Save WhatsApp number"}</button>
      <button type="button" className="auth-switch" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </form></div>;
  }

  if (session) return <Dashboard email={session.user.email ?? "Signed in"} />;
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-brand">🏏 <span>TurfMate</span></div>
    <p className="auth-subtitle">MANHATTAN CRICKET</p>
    <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
    <p className="auth-copy">Sign in to access your cricket group's workspace.</p>
    <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
    {message && <p className="auth-message" role="status">{message}</p>}
    <button className="primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button type="button" className="auth-switch" onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setMessage("");}}>
      {mode === "signin" ? "New to TurfMate? Create an account" : "Already registered? Sign in"}
    </button>
  </form></div>;
}
