import { FormEvent, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Dashboard from "./Dashboard";

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

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

  if (loading) return <div className="auth-screen"><div className="auth-card">Loading TurfMate…</div></div>;
  if (session) return <Dashboard email={session.user.email ?? "Signed in"} />;

  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}>
    <div className="auth-brand">🏏 <span>TurfMate</span></div>
    <p className="auth-subtitle">MANHATTAN CRICKET</p>
    <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
    <p className="auth-copy">Sign in to access your cricket group's workspace.</p>
    <label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
    <label>Password<input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>
    {message && <p className="auth-message" role="status">{message}</p>}
    <button className="primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
    <button type="button" className="auth-switch" onClick={()=>{setMode(mode === "signin" ? "signup" : "signin");setMessage("");}}>
      {mode === "signin" ? "New to TurfMate? Create an account" : "Already registered? Sign in"}
    </button>
  </form></div>;
}
