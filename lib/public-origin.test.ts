import { describe, expect, it } from "vitest";
import { getPublicOrigin } from "./public-origin";

const request = (headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/auth/cla/callback", { headers });

describe("getPublicOrigin", () => {
  it("utilise les en-têtes X-Forwarded-* du reverse proxy", () => {
    expect(
      getPublicOrigin(
        request({
          "x-forwarded-proto": "https",
          "x-forwarded-host": "trezo.example",
        }),
      ),
    ).toBe("https://trezo.example");
  });

  it("garde le premier proxy quand les en-têtes sont chaînés", () => {
    expect(
      getPublicOrigin(
        request({
          "x-forwarded-proto": "https, http",
          "x-forwarded-host": "trezo.example, interne:3000",
        }),
      ),
    ).toBe("https://trezo.example");
  });

  it("retombe sur request.url sans en-têtes forwarded", () => {
    expect(getPublicOrigin(request())).toBe("http://localhost:3000");
  });

  it("retombe sur request.url si un seul des deux en-têtes est présent", () => {
    expect(
      getPublicOrigin(request({ "x-forwarded-host": "trezo.example" })),
    ).toBe("http://localhost:3000");
  });
});
