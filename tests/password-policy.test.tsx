import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordField } from "../src/components/auth/password-field";
import { signUpSchema } from "../src/lib/auth/validation";

afterEach(cleanup);

describe("password requirements", () => {
  it("checks requirements while typing and clears them when the password is removed", async () => {
    const user = userEvent.setup();
    render(createElement(PasswordField, { name: "password", label: "Senha" }));
    const field = screen.getByLabelText("Senha");
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(checkboxes.every((checkbox) => !checkbox.checked && checkbox.disabled)).toBe(true);
    await user.type(field, "Long-password1!");
    expect(checkboxes.every((checkbox) => checkbox.checked)).toBe(true);
    await user.clear(field);
    expect(checkboxes.every((checkbox) => !checkbox.checked)).toBe(true);
  });

  it.each(["short", "long-password", "LONG-PASSWORD1!", "Longpassword1", "Long-password!", "Long-password1! "])(
    "rejects a password that does not meet all requirements: %s", (password) => {
      expect(signUpSchema.safeParse({ username: "ana", fullName: "Ana Silva", email: "ana@example.com", password }).success).toBe(false);
    },
  );
});
