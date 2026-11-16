"use client";

import { useId, useState } from "react";

export function PasswordField({
  name,
  label,
  autoComplete = "new-password",
  requiresPolicy = true,
}: {
  name: string;
  label: string;
  autoComplete?: string;
  requiresPolicy?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-espresso">
        {label}
      </label>
      <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={requiresPolicy ? 8 : undefined}
        maxLength={256}
        pattern={requiresPolicy ? "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s]).{8,256}" : undefined}
        title={requiresPolicy ? "Use pelo menos 8 caracteres, com uma letra maiúscula, uma minúscula, um número e um símbolo." : undefined}
        className="w-full rounded-xl border border-sand bg-white px-3 py-2 pr-12 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
      />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-2 flex w-8 items-center justify-center">
        <img src={visible ? "/visibility_off_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" : "/visibility_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"} alt="" aria-hidden="true" className="h-5 w-5" />
      </button>
      </div>
      {requiresPolicy && <p className="text-xs text-stone-500">Mínimo de 8 caracteres, com maiúscula, minúscula, número e símbolo.</p>}
    </div>
  );
}
