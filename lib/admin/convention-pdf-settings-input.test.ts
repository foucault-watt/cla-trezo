import { describe, expect, it } from "vitest";
import { parseConventionPdfSettingsForm } from "./convention-pdf-settings-input";

function validForm() {
  const form = new FormData();
  form.set("claAssociationName", "Centrale Lille Associations");
  form.set("claAddress", "1 rue de Lille");
  form.set(
    "claRepresentatives",
    JSON.stringify([{ name: "Camille Martin", role: "Présidente" }]),
  );
  form.set("claSignatoryName", "Camille Martin");
  form.set("claSignatoryRole", "Présidente");
  form.set("claSignatureCity", "Lille");
  return form;
}

describe("parseConventionPdfSettingsForm", () => {
  it("valide une configuration CLA complète", () => {
    expect(parseConventionPdfSettingsForm(validForm()).success).toBe(true);
  });

  it("refuse une liste de représentants illisible", () => {
    const form = validForm();
    form.set("claRepresentatives", "pas du json");

    expect(parseConventionPdfSettingsForm(form).success).toBe(false);
  });
});
