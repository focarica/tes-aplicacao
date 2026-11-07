"use client";

import { useEffect, useId, useRef, useState } from "react";
import { passwordRules } from "@/lib/auth/password-policy";

export function PasswordField({ name, label }: { name: string; label: string }) {
  const [password, setPassword] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    const form = inputRef.current?.form;
    const reset = () => setPassword("");
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, []);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={256}
        aria-describedby={`${id}-requirements`}
        onChange={(event) => setPassword(event.target.value)}
      />
      <fieldset id={`${id}-requirements`} className="password-requirements">
        <legend>A senha deve conter:</legend>
        {passwordRules.map((rule) => (
          <label key={rule.id} className="password-rule">
            <input type="checkbox" checked={rule.test(password)} disabled />
            <span>{rule.label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
