"use client";

import { useEffect, useState } from "react";
import { Drawer, DrawerSection, DrawerField } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

type TeacherDetail = {
  id: string;
  dni: string | null;
  phone: string | null;
  address: string | null;
  hourlyRate: string | null;
  user: { name: string };
  classrooms: { id: string; name: string; level: string; activeCount: number }[];
  payrollItems: { id: string; period: string; hours: string; amount: string; paid: boolean }[];
};

function ClassroomCard({ classroom }: { classroom: TeacherDetail["classrooms"][number] }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-neutral-900">{classroom.name}</span>
        <Badge tone="neutral">{classroom.level}</Badge>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{classroom.activeCount} alumnos activos</p>
    </div>
  );
}

export function TeacherDrawer({ teacherId, onClose }: { teacherId: string; onClose: () => void }) {
  const [teacher, setTeacher] = useState<TeacherDetail | null>(null);

  useEffect(() => {
    fetch(`/api/teachers/${teacherId}`)
      .then((res) => res.json())
      .then(setTeacher);
  }, [teacherId]);

  return (
    <Drawer open onClose={onClose} title={teacher?.user.name ?? "Cargando..."} subtitle="Legajo del docente">
      {!teacher ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : (
        <>
          <DrawerSection title="Datos personales">
            <DrawerField label="Nombre" value={teacher.user.name} />
            <DrawerField label="DNI" value={teacher.dni} />
            <DrawerField label="Teléfono" value={teacher.phone} />
            <DrawerField label="Dirección" value={teacher.address} />
            <DrawerField
              label="Tarifa/hora"
              value={teacher.hourlyRate ? currency.format(Number(teacher.hourlyRate)) : null}
            />
          </DrawerSection>

          <DrawerSection title="Aulas a cargo">
            {teacher.classrooms.map((c) => (
              <ClassroomCard key={c.id} classroom={c} />
            ))}
            {teacher.classrooms.length === 0 && (
              <p className="text-sm text-neutral-500">Sin aulas asignadas.</p>
            )}
          </DrawerSection>

          <DrawerSection title="Historial de liquidaciones">
            <Table>
              <Thead>
                <Tr>
                  <Th>Período</Th>
                  <Th>Horas</Th>
                  <Th>Monto</Th>
                  <Th>Pagado</Th>
                </Tr>
              </Thead>
              <Tbody>
                {teacher.payrollItems.map((p) => (
                  <Tr key={p.id}>
                    <Td>{p.period}</Td>
                    <Td>{p.hours}</Td>
                    <Td>{currency.format(Number(p.amount))}</Td>
                    <Td>{p.paid ? <Badge tone="success">Sí</Badge> : <Badge tone="warning">No</Badge>}</Td>
                  </Tr>
                ))}
                {teacher.payrollItems.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-neutral-500">
                      Sin liquidaciones registradas.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}
