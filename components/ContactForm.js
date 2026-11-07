"use client";

import { useState } from "react";

export default function ContactForm({ formspreeId, email }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!formspreeId) {
      const subject = encodeURIComponent(`Hello from ${data.get("name") || "your website"}`);
      const body = encodeURIComponent(
        `${data.get("message")}\n\n— ${data.get("name")}${data.get("company") ? `, ${data.get("company")}` : ""}\n${data.get("email")}${data.get("github") ? `\nGitHub: ${data.get("github")}` : ""}`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      return;
    }

    setState("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error();
      form.reset();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="row">
        <label>
          <span>Full Name <b className="req" aria-hidden="true">*</b></span>
          <input name="name" required aria-required="true" autoComplete="name" />
        </label>
        <label>
          <span>Email Address <b className="req" aria-hidden="true">*</b></span>
          <input name="email" type="email" required aria-required="true" autoComplete="email" />
        </label>
      </div>
      <label>
        <span>Company <em>(optional)</em></span>
        <input name="company" autoComplete="organization" />
      </label>
      <label>
        <span>Message <b className="req" aria-hidden="true">*</b></span>
        <textarea name="message" rows={5} required aria-required="true" />
      </label>
      <label>
        <span>GitHub <em>(optional)</em></span>
        <input name="github" type="text" inputMode="url" placeholder="github.com/username" autoComplete="url" />
      </label>
      <p className="form-legend"><b className="req" aria-hidden="true">*</b> Required</p>
      <button className="btn primary" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
      {state === "sent" && <p className="form-note ok">Thanks — I&apos;ll get back to you soon.</p>}
      {state === "error" && (
        <p className="form-note err">
          Something went wrong. You can email me directly at <a href={`mailto:${email}`}>{email}</a>.
        </p>
      )}
    </form>
  );
}
