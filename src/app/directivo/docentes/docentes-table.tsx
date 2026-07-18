"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { TeacherDrawer } from "./teacher-drawer";
import { NewTeacherForm } from "./new-teacher-form";

type TeacherListItem = {
  id: string;
  dni: string | null;
  phone: string | null;
  hourlyRate: number | null;
  user: { name: string; email: string };
  classrooms: { id: string; name: string }[];
};

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export function DocentesTable({ initialTeachers }: { initialTeachers: TeacherListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialTeachers;
    return initialTeachers.filter(
      (t) => t.user.name.toLowerCase().includes(q) || (t.dni ?? "").toLowerCase().includes(q)
    );
  }, [initialTeachers, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-sm relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre o DNI…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          + Nuevo docente
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Docente</Th>
            <Th>Teléfono</Th>
            <Th>Tarifa/hora</Th>
            <Th>Aulas a cargo</Th>
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {filtered.map((t) => {
            const visibleClassrooms = t.classrooms.slice(0, 2);
            const extra = t.classrooms.length - visibleClassrooms.length;
            return (
              <Tr key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.user.name} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-neutral-900">{t.user.name}</span>
                        {(!t.dni || !t.phone) && (
                          <Badge tone="warning">Legajo incompleto</Badge>
                        )}
                      </div>
                      {t.dni && <div className="text-xs text-neutral-400">{t.dni}</div>}
                    </div>
                  </div>
                </Td>
                <Td>{t.phone ?? "—"}</Td>
                <Td className="tabular-nums">{t.hourlyRate != null ? currency.format(t.hourlyRate) : "—"}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {visibleClassrooms.map((c) => (
                      <Badge key={c.id} tone="neutral">
                        {c.name}
                      </Badge>
                    ))}
                    {extra > 0 && <Badge tone="neutral">+{extra}</Badge>}
                  </div>
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(t.id);
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
              <Td colSpan={5} className="text-center text-neutral-500">
                No se encontraron docentes.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {selectedId && <TeacherDrawer key={selectedId} teacherId={selectedId} onClose={() => setSelectedId(null)} />}
      {showNew && (
        <NewTeacherForm
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
