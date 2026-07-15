"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EnrollmentStatus } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnrollmentStatusBadge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Drawer } from "@/components/ui/drawer";

type EnrollmentItem = {
  id: string;
  status: EnrollmentStatus;
  student: { id: string; dni: string | null; user: { name: string } };
};

type StudentOption = { id: string; dni: string | null; user: { name: string } };

const selectClass =
  "rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function Roster({
  classroomId,
  initialEnrollments,
  allStudents,
}: {
  classroomId: string;
  initialEnrollments: EnrollmentItem[];
  allStudents: StudentOption[];
}) {
  const router = useRouter();
  const [showEnroll, setShowEnroll] = useState(false);

  async function handleStatusChange(enrollmentId: string, status: string) {
    const res = await fetch(`/api/classrooms/${classroomId}/enrollments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-neutral-900">Alumnos inscriptos</h3>
        <Button variant="primary" size="sm" onClick={() => setShowEnroll(true)}>
          + Inscribir alumno
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>DNI</Th>
            <Th>Estado</Th>
          </Tr>
        </Thead>
        <Tbody>
          {initialEnrollments.map((e) => (
            <Tr key={e.id}>
              <Td className="font-medium text-neutral-900">{e.student.user.name}</Td>
              <Td>{e.student.dni ?? "—"}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <EnrollmentStatusBadge status={e.status} />
                  <select
                    className={selectClass}
                    defaultValue={e.status}
                    onChange={(ev) => handleStatusChange(e.id, ev.target.value)}
                  >
                    <option value="ACTIVA">Activa</option>
                    <option value="PAUSADA">Pausada</option>
                    <option value="FINALIZADA">Finalizada</option>
                  </select>
                </div>
              </Td>
            </Tr>
          ))}
          {initialEnrollments.length === 0 && (
            <Tr>
              <Td colSpan={3} className="text-center text-neutral-500">
                Todavía no hay alumnos inscriptos en esta aula.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {showEnroll && (
        <EnrollForm
          classroomId={classroomId}
          allStudents={allStudents}
          enrolledIds={initialEnrollments.map((e) => e.student.id)}
          onClose={() => setShowEnroll(false)}
          onEnrolled={() => {
            setShowEnroll(false);
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}

function EnrollForm({
  classroomId,
  allStudents,
  enrolledIds,
  onClose,
  onEnrolled,
}: {
  classroomId: string;
  allStudents: StudentOption[];
  enrolledIds: string[];
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const available = useMemo(() => {
    const enrolled = new Set(enrolledIds);
    const q = query.trim().toLowerCase();
    return allStudents.filter((s) => {
      if (enrolled.has(s.id)) return false;
      if (q && !s.user.name.toLowerCase().includes(q) && !(s.dni ?? "").includes(q)) return false;
      return true;
    });
  }, [allStudents, enrolledIds, query]);

  async function handleEnroll(studentId: string) {
    setSavingId(studentId);
    setError(null);
    const res = await fetch(`/api/classrooms/${classroomId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    setSavingId(null);
    if (!res.ok) {
      setError("No se pudo inscribir al alumno.");
      return;
    }
    onEnrolled();
  }

  return (
    <Drawer open onClose={onClose} title="Inscribir alumno">
      <Input
        placeholder="Buscar por nombre o DNI..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {error && <p className="text-sm text-danger-700">{error}</p>}
      <ul className="space-y-1">
        {available.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={savingId === s.id}
              onClick={() => handleEnroll(s.id)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              <span className="font-medium text-neutral-900">{s.user.name}</span>
              <span className="text-neutral-400">{s.dni ?? "—"}</span>
            </button>
          </li>
        ))}
        {available.length === 0 && <p className="text-sm text-neutral-500">Sin resultados.</p>}
      </ul>
    </Drawer>
  );
}
