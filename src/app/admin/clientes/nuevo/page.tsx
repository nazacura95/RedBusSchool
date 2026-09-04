import { NewClientWizard } from "./wizard";

export default function NuevoClientePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Nuevo cliente</h1>
      <NewClientWizard />
    </div>
  );
}
