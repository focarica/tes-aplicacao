"use client";

import { useActionState, useEffect, useRef } from "react";
import { confirmSignUpAction } from "@/app/actions/signup";
import type { AuthActionState } from "@/models/auth-action.model";

export function ConfirmationDialog({ username }: { username: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(confirmSignUpAction, {});

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="w-[min(28rem,calc(100%_-_4rem))] max-h-[calc(100dvh_-_4rem)] overflow-y-auto rounded-3xl border border-sand bg-cream p-6 text-stone-800 shadow-xl backdrop:bg-black/50"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
    >
      <h2 id="confirmation-title" className="text-xl font-semibold text-espresso">
        Confirme seu cadastro
      </h2>
      <p id="confirmation-description" className="mt-1 text-sm text-stone-500">
        Informe o código enviado ao seu email para ativar a conta de {username}.
      </p>
      <form action={formAction} className="mt-5 space-y-3">
        <input type="hidden" name="username" value={username} />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-espresso">Código de confirmação</span>
          <input
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            required
            minLength={4}
            maxLength={10}
            className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
          />
        </label>
        {state.error && (
          <p className="text-sm text-amber-700" role="alert">
            {state.error}
          </p>
        )}
        <button
          className="w-full rounded-xl bg-espresso px-3 py-2 font-medium text-amber-50 hover:bg-espresso-light disabled:opacity-50 disabled:cursor-wait"
          type="submit"
          disabled={pending}
        >
          {pending ? "Confirmando…" : "Confirmar conta"}
        </button>
        <button
          className="w-full rounded-xl border border-sand-dark bg-cream px-3 py-2 text-sm text-espresso hover:bg-parchment disabled:opacity-50"
          type="button"
          disabled={pending}
          onClick={() => dialogRef.current?.close()}
        >
          Confirmar depois
        </button>
      </form>
    </dialog>
  );
}
