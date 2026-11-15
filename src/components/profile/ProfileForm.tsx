"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { ProfileActionState } from "@/models/profile-action.model";

const initialState: ProfileActionState = {};

export function ProfileForm({ fullName, description }: { fullName: string; description: string }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Nome completo</span>
        <input
          name="fullName"
          defaultValue={fullName}
          required
          minLength={2}
          maxLength={200}
          autoComplete="name"
          className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 outline-none focus:ring-2 focus:ring-latte/50"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-espresso">Descrição</span>
        <textarea
          name="description"
          defaultValue={description}
          maxLength={500}
          rows={4}
          placeholder="Conte um pouco sobre você."
          className="w-full rounded-xl border border-sand bg-white px-3 py-2 text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-latte/50"
        />
      </label>
      {state.error && <p className="text-sm text-amber-700" role="alert">{state.error}</p>}
      {state.message && <p className="text-sm text-emerald-700" role="status">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-espresso px-4 py-2 text-sm font-medium text-amber-50 hover:bg-espresso-light disabled:cursor-wait disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}
