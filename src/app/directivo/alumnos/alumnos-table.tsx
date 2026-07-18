"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { EnrollmentStatus, PaymentStatus } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge, EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { StudentDrawer } from "./student-drawer";
import { NewStudentForm } from "./new-student-form";

type StudentListItem = {
  id: string;
  dni: string | null;
  phone: string | null;
  user: { name: string; email: string };
  enrollments: { status: EnrollmentStatus; classroom: { id: string; name: string } }[];
  payments: { status: PaymentStatus }[];
};

type ClassroomOption = { id: string; name: string };

const selectClass =
  "rounded-md border-[1.5px] border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function AlumnosTable({
  initialStudents,
  classrooms,
}: {
  initialStudents: StudentListItem[];
  classrooms: ClassroomOption[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [aula, setAula] = useState("");
  const [estado, setEstado] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialStudents.filter((s) => {
      if (q && !s.user.name.toLowerCase().includes(q) && !(s.dni ?? "").includes(q)) return false;
      if (aula && !s.enrollments.some((e) => e.classroom.id === aula)) return false;
      if (estado) {
        const current = s.enrollments.find((e) => e.status === "ACTIVA") ?? s.enrollments[0];
        if (current?.status !== estado) return false;
      }
      return true;
    });
  }, [initialStudents, query, aula, estado]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Buscar por nombre o DNI…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className={selectClass} value={aula} onChange={(e) => setAula(e.target.value)}>
            <option value="">Todas las aulas</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className={selectClass} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="ACTIVA">Activa</option>
            <option value="PAUSADA">Pausada</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          + Nuevo alumno
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Alumno</Th>
            <Th>Teléfono</Th>
            <Th>Aula(s)</Th>
            <Th>Estado</Th>
            <Th>Pagos</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {filtered.map((s) => {
            const currentEnrollment = s.enrollments.find((e) => e.status === "ACTIVA") ?? s.enrollments[0];
            const latestPayment = s.payments[0];
            const visibleClassrooms = s.enrollments.slice(0, 2);
            const extra = s.enrollments.length - visibleClassrooms.length;
            return (
              <Tr key={s.id} className="cursor-pointer" onClick={() => setSelectedId(s.id)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.user.name} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-900">{s.user.name}</span>
                        {(!s.dni || !s.phone) && (
                          <Badge tone="warning">Legajo incompleto</Badge>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">{s.dni ?? "—"}</div>
                    </div>
                  </div>
                </Td>
                <Td>{s.phone ?? "—"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {visibleClassrooms.map((e) => (
                      <Badge key={e.classroom.id} tone="neutral">
                        {e.classroom.name}
                      </Badge>
                    ))}
                    {extra > 0 && <Badge tone="neutral">+{extra}</Badge>}
                  </div>
                </Td>
                <Td>{currentEnrollment ? <EnrollmentStatusBadge status={currentEnrollment.status} /> : "—"}</Td>
                <Td>{latestPayment ? <PaymentStatusBadge status={latestPayment.status} /> : "—"}</Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(s.id);
                    }}
                  >
                    Ver legajo
                  </Button>
                </Td>
              </Tr>
            );
          })}
          {filtered.length === 0 && (
            <Tr>
              <Td colSpan={6} className="text-center text-neutral-500">
                No se encontraron alumnos.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {selectedId && <StudentDrawer key={selectedId} studentId={selectedId} onClose={() => setSelectedId(null)} />}
      {showNew && (
        <NewStudentForm
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
