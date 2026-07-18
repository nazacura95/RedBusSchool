"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GradeSubmission } from "./grade-submission";

type Submission = {
  id: string;
  studentId: string;
  content: string | null;
  status: "ENTREGADO" | "CORREGIDO";
  grade: string | null;
  feedback: string | null;
  submittedAt: string;
  student: { user: { name: string } };
};
type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  submissions: Submission[];
};

export function AssignmentsPanel({
  classroomId,
  initialAssignments,
  totalActiveStudents,
}: {
  classroomId: string;
  initialAssignments: Assignment[];
  totalActiveStudents: number;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grading, setGrading] = useState<{ assignmentId: string; assignmentTitle: string; submission: Submission } | null>(
    null
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/classrooms/${classroomId}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || undefined, dueDate: dueDate || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo crear la tarea.");
      return;
    }
    const assignment = await res.json();
    setAssignments((prev) => [assignment, ...prev]);
    setTitle("");
    setDescription("");
    setDueDate("");
  }

  return (
    <Card>
      <h3 className="font-semibold text-neutral-900">Tareas</h3>

      <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="assignment-title">Título</Label>
          <Input
            id="assignment-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Ejercicios unidad 3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignment-description">Descripción (opcional)</Label>
          <Input
            id="assignment-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Consigna breve"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignment-due">Fecha de entrega (opcional)</Label>
          <Input
            id="assignment-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={!title.trim() || saving}>
          {saving ? "Creando…" : "Crear tarea"}
        </Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}

      <div className="mt-6 space-y-2">
        {assignments.length === 0 && (
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Sin tareas creadas</p>
              <p className="text-sm text-neutral-600">Todavía no creaste tareas.</p>
            </div>
          </div>
        )}
        {assignments.map((a) => {
          const entregado = a.submissions.filter((s) => s.status === "ENTREGADO").length;
          const corregido = a.submissions.filter((s) => s.status === "CORREGIDO").length;
          return (
            <div key={a.id} className="rounded-lg border border-neutral-200 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-neutral-900">{a.title}</span>
                <span className="text-sm text-neutral-500">
                  {a.submissions.length} / {totalActiveStudents} entregas
                  {a.dueDate && ` · vence ${new Date(a.dueDate).toLocaleDateString("es-AR")}`}
                </span>
              </div>
              {a.description && <p className="mt-1 text-sm text-neutral-600">{a.description}</p>}
              <div className="mt-2 flex gap-2">
                <Badge tone="warning">{entregado} entregado{entregado === 1 ? "" : "s"}</Badge>
                <Badge tone="success">{corregido} corregido{corregido === 1 ? "" : "s"}</Badge>
              </div>
              {a.submissions.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-neutral-100 pt-3">
                  {a.submissions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-neutral-700">{s.student.user.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge tone={s.status === "CORREGIDO" ? "success" : "warning"}>
                          {s.status === "CORREGIDO" ? "Corregido" : "Entregado"}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setGrading({ assignmentId: a.id, assignmentTitle: a.title, submission: s })}
                        >
                          {s.status === "CORREGIDO" ? "Ver corrección" : "Corregir"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <GradeSubmission
        open={grading !== null}
        onClose={() => setGrading(null)}
        submission={grading?.submission ?? null}
        studentName={grading?.submission.student.user.name ?? ""}
        assignmentTitle={grading?.assignmentTitle ?? ""}
        onSaved={(updated) => {
          setAssignments((prev) =>
            prev.map((a) =>
              a.id === grading?.assignmentId
                ? { ...a, submissions: a.submissions.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)) }
                : a
            )
          );
        }}
      />
    </Card>
  );
}
