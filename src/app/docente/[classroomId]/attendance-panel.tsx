"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";

type Student = { enrollmentId: string; name: string };

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AttendancePanel({ classroomId, students }: { classroomId: string; students: Student[] }) {
  const [date, setDate] = useState(todayLocal);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { showToast } = useToast();

  const unmarkedCount = students.filter((s) => attendance[s.enrollmentId] === undefined).length;

  useEffect(() => {
    fetch(`/api/classrooms/${classroomId}/attendance?date=${date}`)
      .then((res) => res.json())
      .then((records: { enrollmentId: string; present: boolean }[]) => {
        const map: Record<string, boolean> = {};
        records.forEach((r) => (map[r.enrollmentId] = r.present));
        setAttendance(map);
      });
  }, [classroomId, date]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    const records = students
      .filter((s) => attendance[s.enrollmentId] !== undefined)
      .map((s) => ({ enrollmentId: s.enrollmentId, present: attendance[s.enrollmentId] }));

    const res = await fetch(`/api/classrooms/${classroomId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
    } else {
      showToast("No se pudo guardar la asistencia. Probá de nuevo.");
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h3 className="font-semibold text-neutral-900">Asistencia</h3>
        <div className="space-y-1.5">
          <Label htmlFor="attendance-date">Fecha</Label>
          <Input
            id="attendance-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSaved(false);
            }}
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Sin alumnos activos</p>
            <p className="text-sm text-neutral-600">No hay alumnos activos en esta aula.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {students.map((s) => {
              const present = attendance[s.enrollmentId];
              return (
                <div
                  key={s.enrollmentId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-2.5"
                >
                  <span className="font-medium text-neutral-900">{s.name}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAttendance((prev) => ({ ...prev, [s.enrollmentId]: true }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        present === true ? "bg-success-500 text-white" : "bg-success-50 text-success-700"
                      }`}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendance((prev) => ({ ...prev, [s.enrollmentId]: false }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        present === false ? "bg-danger-500 text-white" : "bg-danger-50 text-danger-700"
                      }`}
                    >
                      Ausente
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {unmarkedCount > 0 && (
            <p role="alert" className="mt-3 text-sm text-warning-700">
              Faltan marcar {unmarkedCount} alumno{unmarkedCount > 1 ? "s" : ""}.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave}>
              {saving && <Spinner className="mr-2" />}
              {saving ? "Guardando…" : "Guardar asistencia"}
            </Button>
            {saved && (
              <span role="alert" className="text-sm text-success-700">
                {unmarkedCount > 0 ? `Guardado (faltaron ${unmarkedCount}).` : "Guardado."}
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
