import { describe, expect, it } from "vitest";
import { daysSinceLogin, isStaleLogin, STALE_LOGIN_DAYS } from "./member-login";

const NOW = new Date("2026-09-12T00:00:00Z");

describe("isStaleLogin", () => {
  it("n'est pas obsolète juste sous le seuil", () => {
    const lastLoginAt = new Date(
      NOW.getTime() - (STALE_LOGIN_DAYS - 1) * 24 * 60 * 60 * 1000,
    );
    expect(isStaleLogin(lastLoginAt, NOW)).toBe(false);
  });

  it("devient obsolète exactement au seuil", () => {
    const lastLoginAt = new Date(
      NOW.getTime() - STALE_LOGIN_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(isStaleLogin(lastLoginAt, NOW)).toBe(true);
  });

  it("reste obsolète longtemps après le seuil", () => {
    const lastLoginAt = new Date("2026-01-12T00:00:00Z");
    expect(isStaleLogin(lastLoginAt, NOW)).toBe(true);
  });

  it("une connexion du jour même n'est jamais obsolète", () => {
    expect(isStaleLogin(NOW, NOW)).toBe(false);
  });
});

describe("daysSinceLogin", () => {
  it("compte le nombre de jours écoulés", () => {
    const lastLoginAt = new Date("2026-09-02T00:00:00Z");
    expect(daysSinceLogin(lastLoginAt, NOW)).toBe(10);
  });
});
