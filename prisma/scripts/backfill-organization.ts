import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Corrido a mano, una sola vez, después de la migración A (organizationId nullable en todo)
// y antes de la migración B (NOT NULL + uniques compuestos). Ver plan de migración a Bedel:
// crea la organización de Red Bus y apunta cada fila existente (que hoy no tiene
// organizationId) hacia ella. Correr primero contra una copia de staging/producción y revisar
// los conteos antes de correrlo contra la base real:
//
//   npx tsx prisma/scripts/backfill-organization.ts
//
// Es idempotente: correrlo dos veces no hace nada distinto la segunda vez, porque el where
// siempre filtra por organizationId todavía nulo.
const DEFAULT_ORG_SLUG = process.env.BEDEL_DEFAULT_ORG_SLUG ?? "redbus";
const DEFAULT_ORG_NAME = process.env.BEDEL_DEFAULT_ORG_NAME ?? "Redbus School of English";

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    update: {},
    create: { slug: DEFAULT_ORG_SLUG, name: DEFAULT_ORG_NAME },
  });
  console.log(`Organización: ${org.name} (${org.id})`);

  const tables: { label: string; updateMany: () => Promise<{ count: number }> }[] = [
    { label: "users", updateMany: () => prisma.user.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "student_profiles", updateMany: () => prisma.studentProfile.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "teacher_profiles", updateMany: () => prisma.teacherProfile.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "classrooms", updateMany: () => prisma.classroom.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "payments", updateMany: () => prisma.payment.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "payroll_items", updateMany: () => prisma.payrollItem.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "expenses", updateMany: () => prisma.expense.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "leads", updateMany: () => prisma.lead.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
    { label: "whatsapp_conversations", updateMany: () => prisma.whatsAppConversation.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }) },
  ];

  for (const table of tables) {
    const { count } = await table.updateMany();
    console.log(`${table.label}: ${count} filas backfilleadas`);
  }

  // conteo de verificación: no debería quedar ninguna fila sin organización en estas tablas.
  const [usersLeft, studentsLeft, teachersLeft, classroomsLeft] = await Promise.all([
    prisma.user.count({ where: { organizationId: null } }),
    prisma.studentProfile.count({ where: { organizationId: null } }),
    prisma.teacherProfile.count({ where: { organizationId: null } }),
    prisma.classroom.count({ where: { organizationId: null } }),
  ]);
  const remaining = usersLeft + studentsLeft + teachersLeft + classroomsLeft;
  if (remaining > 0) {
    throw new Error(
      `Backfill incompleto: quedan ${remaining} filas sin organizationId (users=${usersLeft}, students=${studentsLeft}, teachers=${teachersLeft}, classrooms=${classroomsLeft}). No avanzar a la migración B todavía.`,
    );
  }
  console.log("Verificación OK: no quedan filas sin organización en las tablas críticas.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
