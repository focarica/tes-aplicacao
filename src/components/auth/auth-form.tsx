"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/models/auth-action.model";
import { ConfirmationDialog } from "@/components/auth/confirmation-dialog";

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

export function AuthForm({
  action,
  fields,
  submitLabel,
  initialState,
  confirmRegistration = false,
}: {
  action: AuthAction;
  fields: Array<{ name: string; label: string; type?: string; autoComplete?: string }>;
  submitLabel: string;
  initialState?: AuthActionState;
  confirmRegistration?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState ?? {});
  return (
    <>
      <form action={formAction} className="auth-form">
        {fields.map((field) => (
          <label className="auth-field" key={field.name}>
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              required
              minLength={field.autoComplete === "new-password" ? 8 : undefined}
            />
          </label>
        ))}
        {state.error && <p className="auth-message auth-error" role="alert">{state.error}</p>}
        {state.message && <p className="auth-message" role="status">{state.message}</p>}
        <button className="auth-button" disabled={pending} type="submit">
          {pending ? "Aguarde…" : submitLabel}
        </button>
      </form>
      {confirmRegistration && !pending && state.username && (
        <ConfirmationDialog key={state.username} username={state.username} />
      )}
    </>
  );
}
