"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Drawer, DrawerSection, DrawerField } from "@/components/ui/drawer";
import { Badge, EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Contact = { id: string; name: string; relationship: string; phone: string; email: string | null };

type StudentDetail = {
  id: string;
  dni: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  user: { name: string; email: string; enabled: boolean };
  contacts: Contact[];
  enrollments: {
    id: string;
    status: string;
    startDate: string;
    classroom: { name: string; level: string; teacher: { user: { name: string } } };
    attendances: { present: boolean }[];
  }[];
  payments: { id: string; period: string; amount: string; status: string; method: string | null }[];
  certificates: { id: string; title: string; issuedAt: string }[];
};

function attendanceSummary(enrollments: StudentDetail["enrollments"]) {
  return enrollments
    .filter((e) => e.attendances.length > 0)
    .map((e) => {
      const total = e.attendances.length;
      const present = e.attendances.filter((a) => a.present).length;
      return { key: e.id, classroom: e.classroom.name, present, total };
    });
}

const RELATIONSHIP_OPTIONS = ["Madre", "Padre", "Tutor/a", "Otro"];
const selectClass =
  "w-full rounded-md border-[1.5px] border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function StudentDrawer({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", relationship: "Madre", phone: "", email: "" });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ period: "", amount: "", method: "Efectivo", paid: true });
  const [savingPayment, setSavingPayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingAccess, setTogglingAccess] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<"sent" | "failed" | "skipped" | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((res) => res.json())
      .then((data) => setStudent(data));
  }, [studentId]);

  const attendanceRows = student ? attendanceSummary(student.enrollments) : [];

  async function handleToggleAccess() {
    if (!student) return;
    setTogglingAccess(true);
    setWhatsappStatus(null);
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !student.user.enabled }),
    });
    setTogglingAccess(false);
    if (res.ok) {
      const { enabled, whatsapp } = await res.json();
      setWhatsappStatus(whatsapp);
      setStudent((prev) => (prev ? { ...prev, user: { ...prev.user, enabled } } : prev));
    } else {
      showToast("No se pudo actualizar el acceso. Probá de nuevo.");
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setSaving(false);
    if (res.ok) {
      const contact = await res.json();
      setStudent((prev) => (prev ? { ...prev, contacts: [...prev.contacts, contact] } : prev));
      setContactForm({ name: "", relationship: "Madre", phone: "", email: "" });
      setShowContactForm(false);
    } else {
      showToast("No se pudo guardar el contacto. Probá de nuevo.");
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    const res = await fetch(`/api/students/${studentId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    setSavingPayment(false);
    if (res.ok) {
      const payment = await res.json();
      setStudent((prev) => (prev ? { ...prev, payments: [payment, ...prev.payments] } : prev));
      setPaymentForm({ period: "", amount: "", method: "Efectivo", paid: true });
      setShowPaymentForm(false);
    } else {
      showToast("No se pudo registrar el pago. Probá de nuevo.");
    }
  }

  async function handleDeleteContact(contactId: string) {
    const res = await fetch(`/api/students/${studentId}/contacts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId }),
    });
    if (res.ok) {
      setStudent((prev) => (prev ? { ...prev, contacts: prev.contacts.filter((c) => c.id !== contactId) } : prev));
    } else {
      showToast("No se pudo eliminar el contacto. Probá de nuevo.");
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={student?.user.name ?? "Legajo del alumno"}
      subtitle={student?.dni ? `DNI ${student.dni}` : undefined}
    >
      {!student ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : (
        <>
          <DrawerSection title="Datos personales">
            <DrawerField label="Nombre" value={student.user.name} />
            <DrawerField label="DNI" value={student.dni} />
            <DrawerField
              label="Fecha de nacimiento"
              value={student.birthDate ? new Date(student.birthDate).toLocaleDateString("es-AR") : undefined}
            />
            <DrawerField label="Dirección" value={student.address} />
            <DrawerField label="Teléfono" value={student.phone} />
            <DrawerField label="Email" value={student.user.email} />
            <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 p-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">Acceso a la plataforma</p>
                <p className="text-xs text-neutral-500">
                  {student.user.enabled
                    ? "Habilitado: puede activar/recuperar su contraseña en /recuperar."
                    : "Deshabilitado: no puede entrar ni activar su cuenta."}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={student.user.enabled ? "secondary" : "primary"}
                onClick={handleToggleAccess}
                disabled={togglingAccess}
              >
                {togglingAccess ? "Guardando..." : student.user.enabled ? "Deshabilitar" : "Habilitar acceso"}
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
            {whatsappStatus === "skipped" && !student.phone && (
              <p role="alert" className="mt-2 text-xs text-warning-700">
                No tiene teléfono cargado: no se le pudo avisar por WhatsApp.
              </p>
            )}
          </DrawerSection>

          <DrawerSection title="Contactos de emergencia">
            <div className="space-y-2">
              {student.contacts.map((c) => (
                <EmergencyContactCard key={c.id} contact={c} onDelete={() => handleDeleteContact(c.id)} />
              ))}
              {student.contacts.length === 0 && (
                <p className="text-sm text-neutral-500">Sin contactos cargados.</p>
              )}
            </div>
            {showContactForm ? (
              <form onSubmit={handleAddContact} className="mt-2 space-y-2 rounded-lg border border-neutral-200 p-3">
                <Input
                  placeholder="Nombre"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <select
                  className={selectClass}
                  value={contactForm.relationship}
                  onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                >
                  {RELATIONSHIP_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Teléfono"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  required
                />
                <Input
                  placeholder="Email (opcional)"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowContactForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowContactForm(true)}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                + Agregar contacto
              </button>
            )}
          </DrawerSection>

          <DrawerSection title="Historial académico">
            <Table>
              <Thead>
                <Tr>
                  <Th>Aula</Th>
                  <Th>Nivel</Th>
                  <Th>Docente</Th>
                  <Th>Estado</Th>
                  <Th>Desde</Th>
                </Tr>
              </Thead>
              <Tbody>
                {student.enrollments.map((e) => (
                  <Tr key={e.id}>
                    <Td>{e.classroom.name}</Td>
                    <Td>{e.classroom.level}</Td>
                    <Td>{e.classroom.teacher.user.name}</Td>
                    <Td>
                      <EnrollmentStatusBadge status={e.status} />
                    </Td>
                    <Td>{new Date(e.startDate).toLocaleDateString("es-AR")}</Td>
                  </Tr>
                ))}
                {student.enrollments.length === 0 && (
                  <Tr>
                    <Td colSpan={5} className="text-center text-neutral-500">
                      Sin inscripciones.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </DrawerSection>

          <DrawerSection title="Historial de pagos">
            <Table>
              <Thead>
                <Tr>
                  <Th>Período</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                  <Th>Método</Th>
                </Tr>
              </Thead>
              <Tbody>
                {student.payments.map((p) => (
                  <Tr key={p.id}>
                    <Td>{p.period}</Td>
                    <Td>${Number(p.amount).toLocaleString("es-AR")}</Td>
                    <Td>
                      <PaymentStatusBadge status={p.status} />
                    </Td>
                    <Td>{p.method ?? "—"}</Td>
                  </Tr>
                ))}
                {student.payments.length === 0 && (
                  <Tr>
                    <Td colSpan={4} className="text-center text-neutral-500">
                      Sin pagos registrados.
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
            {showPaymentForm ? (
              <form onSubmit={handleAddPayment} className="mt-3 space-y-2 rounded-lg border border-neutral-200 p-3">
                <Input
                  placeholder="Período (ej. 2026-07)"
                  value={paymentForm.period}
                  onChange={(e) => setPaymentForm({ ...paymentForm, period: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Monto"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
                <select
                  className={selectClass}
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                >
                  {["Efectivo", "Transferencia", "Mercado Pago", "Otro"].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={paymentForm.paid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paid: e.target.checked })}
                  />
                  Marcar como pagado
                </label>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={savingPayment}>
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPaymentForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                + Registrar pago
              </button>
            )}
          </DrawerSection>

          <DrawerSection title="Certificados">
            {student.certificates.length === 0 ? (
              <p className="text-sm text-neutral-500">Sin certificados todavía.</p>
            ) : (
              <ul className="space-y-1.5">
                {student.certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-900">{c.title}</span>
                    <span className="text-neutral-500">{new Date(c.issuedAt).toLocaleDateString("es-AR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>

          <DrawerSection title="Asistencia">
            {attendanceRows.length === 0 ? (
              <p className="text-sm text-neutral-500">Sin asistencia registrada todavía.</p>
            ) : (
              <ul className="space-y-1.5">
                {attendanceRows.map((r) => (
                  <li key={r.key} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-900">{r.classroom}</span>
                    <span className="text-neutral-500">
                      {r.present} presentes / {r.total} clases registradas ({Math.round((r.present / r.total) * 100)}%)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DrawerSection>
        </>
      )}
    </Drawer>
  );
}

function EmergencyContactCard({ contact, onDelete }: { contact: Contact; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-neutral-900">{contact.name}</span>
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{contact.relationship}</Badge>
          <button onClick={onDelete} className="text-neutral-400 hover:text-danger-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-neutral-500">
        <span>{contact.phone}</span>
        {contact.email && <span>{contact.email}</span>}
      </div>
    </div>
  );
}
