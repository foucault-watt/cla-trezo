import { prisma } from "@/lib/prisma";
import {
  conventionPdfSettingsSchema,
  type ConventionPdfSettingsInput,
} from "./convention-pdf-settings-input";

const SETTINGS_ID = "default";

export const defaultConventionPdfSettings: ConventionPdfSettingsInput = {
  claAssociationName: "Centrale Lille Associations",
  claAddress:
    "École Centrale de Lille, Cité Scientifique, BP 48, 59651 Villeneuve d'Ascq Cedex",
  claRepresentatives: [
    { name: "Mathéo GUEFFIER", role: "Secrétaire général" },
    { name: "Mathis MARCISET", role: "Trésorier" },
  ],
  claSignatoryName: "Mathéo GUEFFIER",
  claSignatoryRole: "Secrétaire général",
  claSignatureCity: "Lille",
};

export async function getConventionPdfSettings(): Promise<ConventionPdfSettingsInput> {
  const settings = await prisma.conventionPdfSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (!settings) {
    return defaultConventionPdfSettings;
  }

  const parsed = conventionPdfSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data : defaultConventionPdfSettings;
}

export async function saveConventionPdfSettings(
  settings: ConventionPdfSettingsInput,
) {
  return prisma.conventionPdfSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...settings },
    update: settings,
  });
}
