"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Submission = {
  content: string | null;
  status: "ENTREGADO" | "CORREGIDO";
  grade: string | null;
  feedback: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  classroom: { name: string };
  submissions: Submission[];
};

export function TareasSection({ initialAssignments }: { initialAssignments: Assignment[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(a: Assignment) {
    setOpenId(a.id);
    setDraft(a.submissions[0]?.content ?? "");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent, assignmentId: string) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "No se pudo entregar la tarea.");
      return;
    }
    const submission = await res.json();
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, submissions: [submission] } : a))
    );
    setOpenId(null);
  }

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-neutral-900">Tareas</h3>
      {assignments.length === 0 ? (
        <p className="text-sm text-neutral-500">No tenés tareas asignadas por el momento.</p>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const mySubmission = a.submissions[0];
            return (
              <div key={a.id} className="rounded-lg border border-neutral-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-neutral-900">{a.title}</span>
                    <span className="ml-2 text-sm text-neutral-500">{a.classroom.name}</span>
                  </div>
                  {a.dueDate && (
                    <span className="text-sm text-neutral-500">
                      vence {new Date(a.dueDate).toLocaleDateString("es-AR")}
                    </span>
                  )}
                </div>
                {a.description && <p className="mt-1 text-sm text-neutral-600">{a.description}</p>}

                <div className="mt-2">
                  {!mySubmission && <Badge tone="warning">Pendiente</Badge>}
                  {mySubmission?.status === "ENTREGADO" && (
                    <Badge tone="neutral">Entregado, esperando corrección</Badge>
                  )}
                  {mySubmission?.status === "CORREGIDO" && <Badge tone="success">Corregido</Badge>}
                </div>

                {mySubmission?.status === "CORREGIDO" ? (
                  <div className="mt-3 space-y-1 rounded-lg bg-neutral-50 p-3 text-sm">
                    <p className="text-neutral-600">{mySubmission.content}</p>
                    {mySubmission.grade && (
                      <p className="font-medium text-neutral-900">Nota: {mySubmission.grade}</p>
                    )}
                    {mySubmission.feedback && (
                      <p className="text-neutral-600">Comentario: {mySubmission.feedback}</p>
                    )}
                  </div>
                ) : openId === a.id ? (
                  <form onSubmit={(e) => handleSubmit(e, a.id)} className="mt-3 space-y-2">
                    <Label htmlFor={`submission-${a.id}`}>Tu entrega</Label>
                    <textarea
                      id={`submission-${a.id}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                      placeholder="Escribí tu respuesta acá..."
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={!draft.trim() || saving}>
                        {saving ? "Enviando..." : "Enviar"}
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setOpenId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-3">
                    {mySubmission && <p className="mb-2 text-sm text-neutral-600">{mySubmission.content}</p>}
                    <Button size="sm" onClick={() => startEdit(a)}>
                      {mySubmission ? "Editar entrega" : "Entregar"}
                    </Button>
                  </div>
                )}
                {openId === a.id && error && <p className="mt-2 text-sm text-danger-700">{error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
