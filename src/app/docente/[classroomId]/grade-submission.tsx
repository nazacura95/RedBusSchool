"use client";

import { useState } from "react";
import { Drawer, DrawerSection } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type SubmissionDetail = {
  id: string;
  content: string | null;
  status: "ENTREGADO" | "CORREGIDO";
  grade: string | null;
  feedback: string | null;
};

type SavedSubmission = {
  id: string;
  status: "CORREGIDO";
  grade: string | null;
  feedback: string | null;
};

export function GradeSubmission({
  open,
  onClose,
  submission,
  studentName,
  assignmentTitle,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  submission: SubmissionDetail | null;
  studentName: string;
  assignmentTitle: string;
  onSaved: (updated: SavedSubmission) => void;
}) {
  if (!submission) return null;

  return (
    <Drawer open={open} onClose={onClose} title={assignmentTitle} subtitle={studentName}>
      {/* key remounts the form (resetting its fields) whenever a different submission is opened */}
      <GradeForm key={submission.id} submission={submission} onSaved={onSaved} onClose={onClose} />
    </Drawer>
  );
}

function GradeForm({
  submission,
  onSaved,
  onClose,
}: {
  submission: SubmissionDetail;
  onSaved: (updated: SavedSubmission) => void;
  onClose: () => void;
}) {
  const [grade, setGrade] = useState(submission.grade ?? "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: grade.trim() || null, feedback: feedback.trim() || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo guardar la corrección.");
      return;
    }
    const updated = await res.json();
    onSaved(updated);
    onClose();
  }

  return (
    <>
      <DrawerSection title="Entrega">
        <p className="whitespace-pre-wrap text-sm text-neutral-700">
          {submission.content || "El alumno no dejó texto en la entrega."}
        </p>
      </DrawerSection>

      <div className="space-y-1.5">
        <Label htmlFor="grade">Nota</Label>
        <Input
          id="grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Ej: 8 o Aprobado"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="feedback">Devolución</Label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          placeholder="Comentarios para el alumno"
          className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      {error && <p className="text-sm text-danger-700">{error}</p>}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : "Guardar corrección"}
      </Button>
    </>
  );
}
