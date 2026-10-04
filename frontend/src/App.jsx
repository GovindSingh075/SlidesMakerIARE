import React,{ useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { request } from "./api";
import { Dashboard } from "./pages/Dashboard";
import { Editor } from "./pages/Editor";
import "./styles.css";

const defaultSlides = [
  { id: 1, title: "Your story starts here", body: "Create beautiful presentations with SlidesMakerIARE." }
];

function Auth({ onLogin }) {
  const [signup, setSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault(); setError("");
    try {
      if (signup) {
        await request("/auth/register", { method: "POST", body: JSON.stringify(form) });
        setSignup(false);
        setError("Account created. Sign in to continue.");
      } else {
        const data = await request("/auth/login", { method: "POST", body: JSON.stringify(form) });
        localStorage.setItem("sm_token", data.token);
        localStorage.setItem("sm_user", JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="logo"><span className="logo-mark"><Sparkles size={16}/></span> SlidesMakerIARE</div>
        <div className="visual-copy">
          <div className="eyebrow">CREATE · PRESENT · INSPIRE</div>
          <h1>Turn ideas into<br/><em>beautiful slides.</em></h1>
          <p>A focused workspace for creating, editing and presenting your ideas.</p>
        </div>
        <div className="glow-card"><div></div><div></div><div></div></div>
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <div className="mobile-logo"><span className="logo-mark"><Sparkles size={16}/></span> SlidesMakerIARE</div>
          <h2>{signup ? "Create your account" : "Welcome back"}</h2>
          <p className="muted">{signup ? "Start building your next presentation." : "Sign in to continue to your workspace."}</p>
          <form onSubmit={submit}>
            {signup && <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
            <label>Email<input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
            <label>Password<input required type="password" minLength="6" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/></label>
            {error && <div className="notice">{error}</div>}
            <button className="primary" type="submit">{signup ? "Create account" : "Sign in"} <span>→</span></button>
          </form>
          <div className="switch">{signup ? "Already have an account?" : "Don't have an account?"} <button onClick={()=>{setSignup(!signup);setError("")}}>{signup ? "Sign in" : "Sign up"}</button></div>
        </div>
      </div>
    </div>
  );
}
function Footer() {
  return (
    <footer className="site-footer">
      Created by <strong>Ashwith  & Govind Singh</strong> · SlidesMakerIARE
    </footer>
  );
}
export default function App() {
  const stored = localStorage.getItem("sm_user");
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);
  const [editing, setEditing] = useState(null);

  if (!user) {
  return (
    <>
      <Auth onLogin={setUser} />
      <Footer />
    </>
  );
}
if (editing) {
  return (
    <>
      <Editor
        presentation={editing}
        onBack={() => setEditing(null)}
      />
      <Footer />
    </>
  );
}
  

  return (
  <>
    <Dashboard
      user={user}
      onEdit={setEditing}
      onLogout={() => {
        localStorage.removeItem("sm_token");
        localStorage.removeItem("sm_user");
        setUser(null);
      }}
    />
    <Footer />
  </>
);

  
}

