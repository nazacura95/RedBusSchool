"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { Drawer } from "@/components/ui/drawer";

type ClassroomListItem = {
  id: string;
  name: string;
  level: string;
  teacher: { user: { name: string } };
  enrollments: { id: string }[];
};

type TeacherOption = { id: string; user: { name: string } };

export function AulasList({
  initialClassrooms,
  teachers,
}: {
  initialClassrooms: ClassroomListItem[];
  teachers: TeacherOption[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Aulas</h2>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          + Nueva aula
        </Button>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Aula</Th>
            <Th>Nivel</Th>
            <Th>Docente</Th>
            <Th>Alumnos activos</Th>
          </Tr>
        </Thead>
        <Tbody>
          {initialClassrooms.map((c) => (
            <Tr key={c.id} className="cursor-pointer" onClick={() => router.push(`/directivo/aulas/${c.id}`)}>
              <Td className="font-medium text-neutral-900">
                <Link href={`/directivo/aulas/${c.id}`} onClick={(e) => e.stopPropagation()}>
                  {c.name}
                </Link>
              </Td>
              <Td>
                <Badge tone="neutral">{c.level}</Badge>
              </Td>
              <Td>{c.teacher.user.name}</Td>
              <Td>{c.enrollments.length}</Td>
            </Tr>
          ))}
          {initialClassrooms.length === 0 && (
            <Tr>
              <Td colSpan={4} className="text-center text-neutral-500">
                Todavía no hay aulas creadas.
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {showNew && (
        <NewAulaForm
          teachers={teachers}
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

function NewAulaForm({
  teachers,
  onClose,
  onCreated,
}: {
  teachers: TeacherOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !level || !teacherId) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, level, teacherId }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo crear el aula.");
      return;
    }
    onCreated();
  }

  return (
    <Drawer open onClose={onClose} title="Nueva aula">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del aula</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="level">Nivel</Label>
          <Input
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Ej: Nivel 3 - Comisión C"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teacher">Docente a cargo</Label>
          <select
            id="teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            required
          >
            {teachers.length === 0 && <option value="">Sin docentes disponibles</option>}
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-danger-700">{error}</p>}
        <Button type="submit" disabled={saving || !teacherId} className="w-full">
          {saving ? "Creando..." : "Crear aula"}
        </Button>
      </form>
    </Drawer>
  );
}
