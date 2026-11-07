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
    <dialog ref={dialogRef} className="confirmation-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description">
      <h2 id="confirmation-title">Confirme seu cadastro</h2>
      <p id="confirmation-description">Informe o código enviado ao seu email para ativar a conta de {username}.</p>
      <form action={formAction} className="auth-form">
        <input type="hidden" name="username" value={username} />
        <label className="auth-field">
          <span>Código de confirmação</span>
          <input name="code" autoComplete="one-time-code" inputMode="numeric" required minLength={4} maxLength={10} />
        </label>
        {state.error && <p className="auth-message auth-error" role="alert">{state.error}</p>}
        <button className="auth-button" type="submit" disabled={pending}>
          {pending ? "Confirmando…" : "Confirmar conta"}
        </button>
        <button className="auth-button" type="button" disabled={pending} onClick={() => dialogRef.current?.close()}>
          Confirmar depois
        </button>
      </form>
    </dialog>
  );
}
