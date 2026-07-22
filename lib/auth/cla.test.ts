import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClaAuthError, getClaLoginUrl, validateClaTicket } from "./cla";

const validPayload = {
  username: "jdupont",
  firstName: "Jean",
  lastName: "Dupont",
  cursus: "GI",
  isAdmin: false,
  associationRoles: [
    { associationSlug: "cla", associationName: "CLA", role: "membre" },
  ],
};

describe("getClaLoginUrl", () => {
  beforeEach(() => {
    process.env.CLA_AUTH_HOST = "https://cla.example.com";
    process.env.CLA_AUTH_IDENTIFIER = "trezo";
  });

  it("construit l'URL de login à partir de la config CLA", () => {
    expect(getClaLoginUrl()).toBe(
      "https://cla.example.com/authentification/trezo",
    );
  });

  it("lève une ClaAuthError si la config CLA est manquante", () => {
    delete process.env.CLA_AUTH_HOST;
    expect(() => getClaLoginUrl()).toThrow(ClaAuthError);
  });
});

describe("validateClaTicket", () => {
  beforeEach(() => {
    process.env.CLA_AUTH_HOST = "https://cla.example.com";
    process.env.CLA_AUTH_IDENTIFIER = "trezo";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retourne le payload quand la réponse CLA est valide", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, payload: validPayload })),
    );

    const payload = await validateClaTicket("ticket-123");

    expect(payload.username).toBe("jdupont");
    expect(fetch).toHaveBeenCalledWith(
      "https://cla.example.com/authentification/trezo/ticket-123",
      { cache: "no-store" },
    );
  });

  it("lève une ClaAuthError si le serveur CLA répond une erreur HTTP", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));

    await expect(validateClaTicket("ticket-123")).rejects.toThrow(
      ClaAuthError,
    );
  });

  it("lève une ClaAuthError si la réponse ne correspond pas au schéma attendu", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, payload: {} })),
    );

    await expect(validateClaTicket("ticket-123")).rejects.toThrow(
      ClaAuthError,
    );
  });
});
