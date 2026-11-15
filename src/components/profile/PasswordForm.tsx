"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/app/actions/profile";
import { PasswordField } from "@/components/auth/password-field";
import type { ProfileActionState } from "@/models/profile-action.model";

const initialState: ProfileActionState = {};

export function PasswordForm() {
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
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={256}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 outline-none focus:ring-2 focus:ring-latte/50"
          />
        </label>
        <PasswordField name="newPassword" label="Nova senha" />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">Confirmar nova senha</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            maxLength={256}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 outline-none focus:ring-2 focus:ring-latte/50"
          />
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
