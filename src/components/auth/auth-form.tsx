"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/models/auth-action.model";
import { PasswordField } from "@/components/auth/password-field";

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

type Field = {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
};

const inputClass =
  "w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50";

export function AuthForm({
  action,
  fields,
  submitLabel,
  initialState,
  initialValues,
}: {
  action: AuthAction;
  fields: Field[];
  submitLabel: string;
  initialState?: AuthActionState;
  initialValues?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState ?? {});
  return (
    <>
      <form action={formAction} className="mt-5 space-y-3">
        {fields.map((field) => {
          if (field.autoComplete === "new-password") {
            return <PasswordField key={field.name} name={field.name} label={field.label} />;
          }
          const required = field.required ?? true;
          return (
            <label className="grid gap-1.5" key={field.name}>
              <span className="text-sm font-medium text-espresso">{field.label}</span>
              {field.multiline ? (
                <textarea
                  name={field.name}
                  defaultValue={initialValues?.[field.name]}
                  required={required}
                  maxLength={field.maxLength}
                  rows={3}
                  className={inputClass}
                />
              ) : (
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  autoComplete={field.autoComplete}
                  defaultValue={initialValues?.[field.name]}
                  required={required}
                  maxLength={field.maxLength}
                  className={inputClass}
                />
              )}
            </label>
          );
        })}
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
    </>
  );
}
