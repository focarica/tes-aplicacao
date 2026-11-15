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
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-espresso">
        {label}
      </label>
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
        className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
      />
      <fieldset id={`${id}-requirements`} className="mt-1 grid gap-1 text-xs text-stone-500">
        <legend className="mb-1">A senha deve conter:</legend>
        {passwordRules.map((rule) => (
          <label key={rule.id} className="flex items-center gap-2">
            <input type="checkbox" checked={rule.test(password)} disabled className="accent-espresso" />
            <span>{rule.label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
