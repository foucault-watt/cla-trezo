import { describe, expect, it } from "vitest";
import {
  cleanPath,
  deviceKind,
  extractAssoSlug,
  isTrackablePath,
  normalizeRoute,
} from "./routes";

const ID = "3f2b8c1e-5a6d-4e7f-8a9b-0c1d2e3f4a5b";

describe("isTrackablePath", () => {
  it("suit les pages de l'app connectée", () => {
    expect(isTrackablePath("/app")).toBe(true);
    expect(isTrackablePath("/app/bde/notes-de-frais")).toBe(true);
    expect(isTrackablePath("/app/admin/stats")).toBe(true);
  });

  it("ignore la landing, le login, l'Asso démo et les chemins anormaux", () => {
    expect(isTrackablePath("/")).toBe(false);
    expect(isTrackablePath("/login")).toBe(false);
    expect(isTrackablePath("/application")).toBe(false);
    expect(isTrackablePath("/app/club-demo")).toBe(false);
    expect(isTrackablePath("/app/club-demo/notes-de-frais")).toBe(false);
    expect(isTrackablePath("app/bde")).toBe(false);
    expect(isTrackablePath(`/app/${"x".repeat(400)}`)).toBe(false);
  });
});

describe("extractAssoSlug", () => {
  it("lit le slug de l'espace Structure", () => {
    expect(extractAssoSlug("/app/bde/notes-de-frais")).toBe("bde");
    expect(extractAssoSlug("/app/bde?tab=1")).toBe("bde");
  });

  it("ne confond pas l'espace Admin ni l'accueil avec une Asso", () => {
    expect(extractAssoSlug("/app/admin/notes-de-frais")).toBeNull();
    expect(extractAssoSlug("/app")).toBeNull();
    expect(extractAssoSlug("/mentions-legales")).toBeNull();
  });
});

describe("normalizeRoute", () => {
  it("remplace le slug d'Asso et les identifiants", () => {
    expect(normalizeRoute(`/app/bde/notes-de-frais/${ID}`)).toBe(
      "/app/[asso]/notes-de-frais/[id]",
    );
    expect(normalizeRoute(`/app/admin/notes-de-frais/${ID}?x=1`)).toBe(
      "/app/admin/notes-de-frais/[id]",
    );
    expect(normalizeRoute("/app")).toBe("/app");
  });
});

describe("cleanPath", () => {
  it("retire la requête et le fragment, qui peuvent porter un message", () => {
    expect(cleanPath("/app/bde?toast=Note%20supprimée#haut")).toBe("/app/bde");
    expect(cleanPath("/app/bde/")).toBe("/app/bde");
  });
});

describe("deviceKind", () => {
  it("ramène le type Next à trois catégories", () => {
    expect(deviceKind("mobile")).toBe("mobile");
    expect(deviceKind("tablet")).toBe("tablet");
    expect(deviceKind(undefined)).toBe("desktop");
    expect(deviceKind("console")).toBe("desktop");
  });
});
