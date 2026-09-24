import { ConventionSettingsForm } from "./_components/convention-settings-form";
import { getConventionPdfSettings } from "@/lib/admin/convention-pdf-settings";

export default async function AdminPdfSettingsPage() {
  const settings = await getConventionPdfSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres PDF</h1>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Configurez une fois les informations institutionnelles de CLA. Elles
          seront proposées par défaut pour chaque convention de subvention et
          chaque Note de frais validée.
        </p>
      </div>

      <ConventionSettingsForm initialSettings={settings} />
    </div>
  );
}
