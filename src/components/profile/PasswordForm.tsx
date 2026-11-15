"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { changePasswordAction } from "@/app/actions/profile";
import { PasswordField } from "@/components/auth/password-field";
import type { ProfileActionState } from "@/models/profile-action.model";

const initialState: ProfileActionState = {};

export function PasswordForm() {
  const [visible, setVisible] = useState({ current: false, confirm: false });
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  return (
    <section className="rounded-2xl border border-sand bg-cream p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-espresso">Alterar senha</h2>
      <p className="mt-1 text-sm text-stone-500">
        Você continua conectado; use a nova senha no próximo login.
      </p>
      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">Senha atual</span>
          <div className="relative">
          <input
            name="currentPassword"
            type={visible.current ? "text" : "password"}
            autoComplete="current-password"
            required
            maxLength={256}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 pr-12 text-stone-800 outline-none focus:ring-2 focus:ring-latte/50"
          />
          <button type="button" onClick={() => setVisible((value) => ({ ...value, current: !value.current }))} aria-label={visible.current ? "Ocultar senha atual" : "Mostrar senha atual"} className="absolute inset-y-0 right-2 flex w-8 items-center justify-center">
            <img src={visible.current ? "/visibility_off_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" : "/visibility_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"} alt="" aria-hidden="true" className="h-5 w-5" />
          </button>
          </div>
        </label>
        <PasswordField name="newPassword" label="Nova senha" />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">Confirmar nova senha</span>
          <div className="relative">
          <input
            name="confirmPassword"
            type={visible.confirm ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={256}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,256}"
            title="Use pelo menos 8 caracteres, com uma letra maiúscula, uma minúscula, um número e um símbolo."
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 pr-12 text-stone-800 outline-none focus:ring-2 focus:ring-latte/50"
          />
          <button type="button" onClick={() => setVisible((value) => ({ ...value, confirm: !value.confirm }))} aria-label={visible.confirm ? "Ocultar confirmação" : "Mostrar confirmação"} className="absolute inset-y-0 right-2 flex w-8 items-center justify-center">
            <img src={visible.confirm ? "/visibility_off_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg" : "/visibility_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.svg"} alt="" aria-hidden="true" className="h-5 w-5" />
          </button>
          </div>
        </label>
        {state.error && <p className="text-sm text-amber-700" role="alert">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700" role="status">{state.message}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-espresso px-4 py-2 text-sm font-medium text-amber-50 hover:bg-espresso-light disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? "Alterando…" : "Alterar senha"}
        </button>
      </form>
    </section>
  );
}
