"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Drawer, DrawerSection, DrawerField } from "@/components/ui/drawer";
import { Badge, EnrollmentStatusBadge, PaymentStatusBadge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Contact = { id: string; name: string; relationship: string; phone: string; email: string | null };

type StudentDetail = {
  id: string;
  dni: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  user: { name: string; email: string };
  contacts: Contact[];
  enrollments: {
    id: string;
    status: string;
    startDate: string;
    classroom: { name: string; level: string; teacher: { user: { name: string } } };
  }[];
  payments: { id: string; period: string; amount: string; status: string; method: string | null }[];
  certificates: { id: string; title: string; issuedAt: string }[];
};

const RELATIONSHIP_OPTIONS = ["Madre", "Padre", "Tutor/a", "Otro"];
const selectClass =
  "w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function StudentDrawer({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", relationship: "Madre", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((res) => res.json())
      .then((data) => setStudent(data));
  }, [studentId]);

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
