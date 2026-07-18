"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerSection, DrawerField } from "@/components/ui/drawer";

type LeadStatus = "NUEVO" | "CONTACTADO" | "INSCRIPTO" | "DESCARTADO";

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  createdAt: string | Date;
};

const statusTone: Record<LeadStatus, "success" | "warning" | "danger" | "neutral"> = {
  NUEVO: "warning",
  CONTACTADO: "neutral",
  INSCRIPTO: "success",
  DESCARTADO: "danger",
};

const statusLabel: Record<LeadStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  INSCRIPTO: "Inscripto",
  DESCARTADO: "Descartado",
};

const selectClass =
  "w-full rounded-md border-[1.5px] border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function LeadsTable({ initialLeads }: { initialLeads: Lead[] }) {
  const [selected, setSelected] = useState<Lead | null>(null);

  return (
    <div>
      <Table>
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Teléfono</Th>
            <Th>Interés</Th>
            <Th>Estado</Th>
            <Th>Fecha</Th>
          </Tr>
        </Thead>
        <Tbody>
          {initialLeads.map((lead) => (
            <Tr key={lead.id} className="cursor-pointer" onClick={() => setSelected(lead)}>
              <Td className="font-medium text-neutral-900">{lead.name}</Td>
              <Td>{lead.phone}</Td>
              <Td>{lead.interest}</Td>
              <Td>
                <Badge tone={statusTone[lead.status]}>{statusLabel[lead.status]}</Badge>
              </Td>
              <Td>{new Date(lead.createdAt).toLocaleDateString("es-AR")}</Td>
            </Tr>
          ))}
          {initialLeads.length === 0 && (
            <Tr>
              <Td colSpan={5} className="text-center text-neutral-500">
                Todavía no hay interesados.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {selected && <LeadDrawer key={selected.id} lead={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function LeadDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }

  return (
    <Drawer open onClose={onClose} title={lead.name} subtitle={lead.phone}>
      <DrawerSection title="Datos del interesado">
        <DrawerField label="Nombre" value={lead.name} />
        <DrawerField label="Teléfono" value={lead.phone} />
        <DrawerField label="Email" value={lead.email} />
        <DrawerField label="Interés" value={lead.interest} />
        <DrawerField label="Fecha" value={new Date(lead.createdAt).toLocaleDateString("es-AR")} />
        {lead.message && <DrawerField label="Mensaje" value={lead.message} />}
      </DrawerSection>

      <DrawerSection title="Seguimiento">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Estado</label>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {(Object.keys(statusLabel) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Notas internas</label>
          <textarea
            className={selectClass}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas de seguimiento…"
          />
        </div>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          Guardar
        </Button>
      </DrawerSection>
    </Drawer>
  );
}
