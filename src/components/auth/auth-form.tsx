"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/models/auth-action.model";
import { ConfirmationDialog } from "@/components/auth/confirmation-dialog";
import { PasswordField } from "@/components/auth/password-field";

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
      <form action={formAction} className="mt-5 space-y-3">
        {fields.map((field) => field.autoComplete === "new-password" ? (
          <PasswordField key={field.name} name={field.name} label={field.label} />
        ) : (
          <label className="grid gap-1.5" key={field.name}>
            <span className="text-sm font-medium text-espresso">{field.label}</span>
            <input
              name={field.name}
              type={field.type ?? "text"}
              autoComplete={field.autoComplete}
              required
              className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
            />
          </label>
        ))}
        {state.error && (
          <p className="text-sm text-amber-700" role="alert">
            {state.error}
          </p>
        )}
        {state.message && (
          <p className="text-sm text-emerald-700" role="status">
            {state.message}
          </p>
        )}
        <button
          className="w-full rounded-xl bg-espresso px-3 py-2 font-medium text-amber-50 hover:bg-espresso-light disabled:opacity-50 disabled:cursor-wait"
          disabled={pending}
          type="submit"
        >
          {pending ? "Aguarde…" : submitLabel}
        </button>
      </form>
      {confirmRegistration && !pending && state.username && (
        <ConfirmationDialog key={state.username} username={state.username} />
      )}
    </>
  );
}
