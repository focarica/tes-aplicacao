"use client";

import { useId } from "react";

export function PasswordField({ name, label }: { name: string; label: string }) {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-espresso">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="password"
        autoComplete="new-password"
        required
        maxLength={256}
        className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
      />
    </div>
  );
}
