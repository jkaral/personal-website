"use client";

import { useRef, useState } from "react";

// Same check the server runs (app/api/contact/route.js): something@something.tld, no spaces.
// Stricter than the browser's own type="email" check, which accepts addresses like "a@b".
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ContactForm({ email }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const loadedAt = useRef(Date.now()); // bots fill forms in instantly; people take a few seconds

  const checkEmail = (value) => {
    const v = value.trim();
    const msg = !v ? "Please enter your email address" : EMAIL.test(v) ? "" : "That doesn't look like a valid email address";
    setEmailError(msg);
    return !msg;
  };

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (!checkEmail(data.email || "")) {
      form.elements.email.focus();
      return;
    }

    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, elapsed: Date.now() - loadedAt.current }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Something went wrong.");
      form.reset();
      setState("sent");
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="row">
        <label>
          <span>Full Name <b className="req" aria-hidden="true">*</b></span>
          <input name="name" required aria-required="true" autoComplete="name" maxLength={80} />
        </label>
        <label>
          <span>Email Address <b className="req" aria-hidden="true">*</b></span>
          <input
            name="email"
            type="email"
            required
            aria-required="true"
            autoComplete="email"
            maxLength={254}
            aria-invalid={emailError ? "true" : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
            onBlur={(e) => e.target.value && checkEmail(e.target.value)}
            onChange={(e) => emailError && checkEmail(e.target.value)}
          />
          {emailError && <small id="email-error" className="field-error" role="alert">{emailError}</small>}
        </label>
      </div>
      <label>
        <span>Company <em>(optional)</em></span>
        <input name="company" autoComplete="organization" maxLength={100} />
      </label>
      <label>
        <span>Message <b className="req" aria-hidden="true">*</b></span>
        <textarea name="message" rows={5} required aria-required="true" maxLength={5000} />
      </label>
      <label>
        <span>GitHub <em>(optional)</em></span>
        <input name="github" type="text" inputMode="url" placeholder="github.com/username" autoComplete="url" maxLength={100} />
      </label>
      {/* bot trap: hidden from people (and screen readers); bots that fill every field give themselves away */}
      <div className="hp" aria-hidden="true">
        <label>
          Website <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="form-legend"><b className="req" aria-hidden="true">*</b> Required</p>
      <button className="btn primary" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      {state === "sent" && <p className="form-note ok" role="status">Thanks, your message is on its way. I&apos;ll get back to you soon.</p>}
      {state === "error" && (
        <p className="form-note err" role="alert">
          {error.replace(/[.!?]?$/, ".")} You can also email me directly at <a href={`mailto:${email}`}>{email}</a>.
        </p>
      )}
    </form>
  );
}
