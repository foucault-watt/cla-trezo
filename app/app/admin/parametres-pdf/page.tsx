import { ConventionSettingsForm } from "./_components/convention-settings-form";
import { getConventionPdfSettings } from "@/lib/admin/convention-pdf-settings";

export default async function AdminPdfSettingsPage() {
  const settings = await getConventionPdfSettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-base-content/60">
          Administration
        </p>
        <h1 className="text-3xl font-bold">Paramètres PDF</h1>
        <p className="mt-2 max-w-3xl text-base-content/70">
          Configurez une fois les informations institutionnelles de CLA. Elles
          seront proposées par défaut pour chaque convention de subvention et
          chaque Note de frais validée.
        </p>
      </div>

      <ConventionSettingsForm initialSettings={settings} />
    </div>
  );
}
