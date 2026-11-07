import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  confirmSignUpAction: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock("@/app/actions/signup", () => ({ confirmSignUpAction: mocks.confirmSignUpAction }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import HomePage from "../src/app/page";
import { AuthForm } from "../src/components/auth/auth-form";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthenticatedUser.mockResolvedValue(null);
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
});

afterEach(cleanup);

describe("home navigation", () => {
  it("redirects an authenticated user to the dashboard", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ userId: "user-sub" });
    await expect(HomePage()).rejects.toThrow("REDIRECT:/dashboard");
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps login and signup links available to visitors", async () => {
    render(await HomePage());
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Criar conta" }).getAttribute("href")).toBe("/signup");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("registration confirmation", () => {
  it("automatically opens a modal and submits the code with the registered username", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ username: "ana", message: "Cadastro iniciado." });
    mocks.confirmSignUpAction.mockResolvedValue({ error: "Código de confirmação inválido." });
    render(createElement(AuthForm, { action, fields: [], submitLabel: "Criar conta", confirmRegistration: true }));

    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirme seu cadastro" });
    expect(dialog.hasAttribute("open")).toBe(true);

    await user.type(screen.getByLabelText("Código de confirmação"), "123456");
    await user.click(screen.getByRole("button", { name: "Confirmar conta" }));
    await waitFor(() => expect(mocks.confirmSignUpAction).toHaveBeenCalled());
    const formData = mocks.confirmSignUpAction.mock.calls[0][1] as FormData;
    expect(formData.get("username")).toBe("ana");
    expect(formData.get("code")).toBe("123456");
    expect((await screen.findByRole("alert")).textContent).toBe("Código de confirmação inválido.");
    expect(dialog.hasAttribute("open")).toBe(true);
  });

  it("does not open a confirmation modal when registration fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ error: "Cadastro inválido." });
    render(createElement(AuthForm, { action, fields: [], submitLabel: "Criar conta", confirmRegistration: true }));
    await user.click(screen.getByRole("button", { name: "Criar conta" }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
