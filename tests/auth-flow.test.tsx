import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  confirmSignUpAction: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));

vi.mock("@/lib/auth/session", () => ({ getAuthenticatedUser: mocks.getAuthenticatedUser }));
vi.mock("@/app/actions/signup", () => ({ confirmSignUpAction: mocks.confirmSignUpAction }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));

import HomePage from "../src/app/page";
import ConfirmSignupPage from "../src/app/confirm-signup/page";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAuthenticatedUser.mockResolvedValue(null);
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

describe("confirmation page", () => {
  it("prefills the username received from the signup redirect", async () => {
    render(await ConfirmSignupPage({ searchParams: Promise.resolve({ username: "ana" }) }));
    const username = screen.getByLabelText("Nome de usuário") as HTMLInputElement;
    expect(username.value).toBe("ana");
    expect(screen.getByLabelText("Código de confirmação").getAttribute("name")).toBe("code");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
