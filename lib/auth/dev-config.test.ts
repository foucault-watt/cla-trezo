import { describe, expect, it } from "vitest";
import { isDevAuthBypassEnabled, normalizeDevAuthRedirect } from "./dev-config";

describe("isDevAuthBypassEnabled", () => {
  it("active le bypass uniquement quand il est explicitement demandé hors production", () => {
    expect(
      isDevAuthBypassEnabled({
        NODE_ENV: "development",
        DEV_AUTH_BYPASS: "true",
      }),
    ).toBe(true);
    expect(
      isDevAuthBypassEnabled({
        NODE_ENV: "development",
        DEV_AUTH_BYPASS: "false",
      }),
    ).toBe(false);
    expect(
      isDevAuthBypassEnabled({
        NODE_ENV: "production",
        DEV_AUTH_BYPASS: "true",
      }),
    ).toBe(false);
  });
});

describe("normalizeDevAuthRedirect", () => {
  it("conserve les chemins internes avec leur query string", () => {
    expect(normalizeDevAuthRedirect("/app/admin?view=grid")).toBe(
      "/app/admin?view=grid",
    );
  });

  it.each([null, "https://example.com", "//example.com", "/\\example.com"])(
    "remplace une destination externe ou invalide (%s)",
    (value) => {
      expect(normalizeDevAuthRedirect(value)).toBe("/app/admin");
    },
  );
});
