import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

const REPORTS = [
  { type: "alumnos", label: "Alumnos", description: "Nombre, email, DNI, teléfono, aulas y fecha de alta." },
  { type: "pagos", label: "Pagos", description: "Historial de cuotas: período, monto, estado y método." },
  { type: "docentes", label: "Docentes", description: "Nombre, email, teléfono, tarifa por hora y aulas a cargo." },
  { type: "aulas", label: "Aulas", description: "Aula, nivel, docente y cantidad de alumnos inscriptos." },
];

export default async function ReportesPage() {
  const session = await auth();

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Reportes">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900">Reportes</h2>
        <p className="text-sm text-neutral-500">
          Descargá los datos del instituto en formato CSV — se abren directo en Excel o Google Sheets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.type}>
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <FileText className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold text-neutral-900">{r.label}</h3>
            <p className="mt-1 text-sm text-neutral-500">{r.description}</p>
            <a
              href={`/api/reports/${r.type}`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              <Download className="h-4 w-4" />
              Descargar CSV
            </a>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
