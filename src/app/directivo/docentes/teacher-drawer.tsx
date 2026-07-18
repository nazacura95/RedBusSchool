"use client";

import { useEffect, useState } from "react";
import { Drawer, DrawerSection, DrawerField } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

type TeacherDetail = {
  id: string;
  dni: string | null;
  phone: string | null;
  address: string | null;
  hourlyRate: string | null;
  user: { name: string; email: string; enabled: boolean };
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
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<"sent" | "failed" | "skipped" | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/teachers/${teacherId}`)
      .then((res) => res.json())
      .then(setTeacher);
  }, [teacherId]);

  async function handleToggleAccess() {
    if (!teacher) return;
    setTogglingAccess(true);
    setWhatsappStatus(null);
    const res = await fetch(`/api/teachers/${teacherId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !teacher.user.enabled }),
    });
    setTogglingAccess(false);
    if (res.ok) {
      const { enabled, whatsapp } = await res.json();
      setWhatsappStatus(whatsapp);
      setTeacher((prev) => (prev ? { ...prev, user: { ...prev.user, enabled } } : prev));
    } else {
      showToast("No se pudo actualizar el acceso. Probá de nuevo.");
    }
  }

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
            <DrawerField label="Email" value={teacher.user.email} />
            <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 p-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">Acceso a la plataforma</p>
                <p className="text-xs text-neutral-500">
                  {teacher.user.enabled
                    ? "Habilitado: puede activar/recuperar su contraseña en /recuperar."
                    : "Deshabilitado: no puede entrar ni activar su cuenta."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={teacher.user.enabled ? "secondary" : "primary"}
                onClick={handleToggleAccess}
                disabled={togglingAccess}
              >
                {togglingAccess ? "Guardando..." : teacher.user.enabled ? "Deshabilitar" : "Habilitar acceso"}
              </Button>
            </div>
            {whatsappStatus === "sent" && (
              <p role="alert" className="mt-2 text-xs text-success-700">
                Le llegó el WhatsApp de bienvenida.
              </p>
            )}
            {whatsappStatus === "failed" && (
              <p role="alert" className="mt-2 text-xs text-danger-700">
                No se pudo enviar el WhatsApp (¿el gateway está online?). Avisale por otro medio para que entre a
                /recuperar con su email, DNI y teléfono.
              </p>
            )}
            {whatsappStatus === "skipped" && !teacher.phone && (
              <p role="alert" className="mt-2 text-xs text-warning-700">
                No tiene teléfono cargado: no se le pudo avisar por WhatsApp.
              </p>
            )}
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
