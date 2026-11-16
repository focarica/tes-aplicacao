import { beforeEach, describe, expect, it, vi } from "vitest";

const controller = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  updateAvatar: vi.fn(),
}));

vi.mock("@/controllers/profile.controller", () => ({ profileController: controller }));

import { GET, PATCH } from "../src/app/api/profile/route";
import { PUT } from "../src/app/api/profile/avatar/route";

const profile = {
  id: "user-1",
  fullName: "Ana Silva",
  username: "ana",
  email: "ana@example.com",
  profileImageUrl: null,
  description: "Fotógrafa",
  createdAt: "2026-01-02T03:04:05.000Z",
};

function jsonRequest(method: string, body: string, contentType = "application/json") {
  return new Request("http://localhost/api/profile", {
    method,
    headers: { "content-type": contentType },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  controller.getProfile.mockResolvedValue({ ok: true, data: profile });
  controller.updateProfile.mockResolvedValue({ ok: true, data: profile });
  controller.updateAvatar.mockResolvedValue({ ok: true, data: profile });
});

describe("GET /api/profile", () => {
  it("answers 200 with the profile", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile });
  });

  it("passes the controller error status and message through", async () => {
    controller.getProfile.mockResolvedValue({ ok: false, status: 401, error: "Sessão expirada. Entre novamente." });

    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sessão expirada. Entre novamente." });
  });
});

describe.each([
  ["PATCH /api/profile", PATCH, "PATCH", controller.updateProfile, { fullName: "Ana Silva", description: "" }],
  ["PUT /api/profile/avatar", PUT, "PUT", controller.updateAvatar, { key: "avatars/user-1/nova.png" }],
])("%s", (_label, handler, method, controllerMethod, payload) => {
  it("answers 200 with the profile and sends the JSON body to the controller", async () => {
    const response = await handler(jsonRequest(method, JSON.stringify(payload)));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile });
    expect(controllerMethod).toHaveBeenCalledWith(payload);
  });

  it("answers 415 when the body is not declared as JSON", async () => {
    const response = await handler(jsonRequest(method, JSON.stringify(payload), "text/plain"));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Envie os dados em JSON." });
    expect(controllerMethod).not.toHaveBeenCalled();
  });

  it.each([
    ["unreadable JSON", "{fullName:"],
    ["null", "null"],
    ["a list", "[]"],
    ["a string", "\"texto\""],
  ])("answers 400 for %s", async (_case, body) => {
    const response = await handler(jsonRequest(method, body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Envie os dados em JSON." });
    expect(controllerMethod).not.toHaveBeenCalled();
  });

  it("passes the controller error status and message through", async () => {
    controllerMethod.mockResolvedValue({ ok: false, status: 403, error: "Sem permissão para alterar esta imagem." });

    const response = await handler(jsonRequest(method, JSON.stringify(payload)));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Sem permissão para alterar esta imagem." });
  });
});
