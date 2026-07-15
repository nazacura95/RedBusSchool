import { PrismaClient, EnrollmentStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LEVELS = ["Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5", "Nivel 6", "Nivel 7", "Nivel 8"];

const TEACHER_NAMES = [
  "Marina Sosa",
  "Lucas Fernández",
  "Camila Torres",
  "Ezequiel Romero",
  "Julieta Acosta",
  "Nicolás Herrera",
];

const FIRST_NAMES = [
  "Sofía", "Mateo", "Valentina", "Santiago", "Isabella", "Benjamín", "Emma", "Joaquín",
  "Martina", "Thiago", "Catalina", "Bautista", "Renata", "Lorenzo", "Delfina", "Agustín",
  "Mía", "Facundo", "Pilar", "Tomás", "Antonella", "Ignacio", "Victoria", "Federico",
  "Zoe", "Bruno", "Guadalupe", "Gael", "Alma", "Dante",
];

const LAST_NAMES = [
  "González", "Rodríguez", "Gómez", "Fernández", "López", "Díaz", "Martínez", "Pérez",
  "García", "Sánchez", "Romero", "Sosa", "Torres", "Álvarez", "Ruiz", "Ramírez",
  "Flores", "Acosta", "Benítez", "Medina", "Suárez", "Herrera", "Ríos", "Molina",
];

const PAYMENT_METHODS = ["efectivo", "transferencia", "tarjeta"];
const RELATIONSHIPS = ["Madre", "Padre", "Tutor/a"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function fullName(i: number, offset = 0) {
  return `${pick(FIRST_NAMES, i + offset)} ${pick(LAST_NAMES, i * 3 + offset)}`;
}

async function upsertUser(email: string, name: string, password: string, roles: ("ALUMNO" | "DOCENTE" | "DIRECTIVO")[]) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { roles, name },
    create: { email, passwordHash, name, roles },
  });
}

async function main() {
  // 1. Usuario principal: los 3 roles a la vez, para poder ver todas las interfaces.
  const ownerEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@redbusschool.com";
  const ownerPassword = process.env.SEED_ADMIN_PASSWORD ?? "cambiar123";
  const owner = await upsertUser(ownerEmail, "Nazareno Cura", ownerPassword, ["DIRECTIVO", "DOCENTE", "ALUMNO"]);

  const ownerTeacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id, hourlyRate: 8000 },
  });
  const ownerStudentProfile = await prisma.studentProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: { userId: owner.id },
  });

  // 2. Docentes de prueba (además del owner, que también da clases).
  const teacherProfiles = [ownerTeacherProfile];
  for (let i = 0; i < TEACHER_NAMES.length; i++) {
    const email = `docente${i + 1}@redbusschool.com`;
    const user = await upsertUser(email, TEACHER_NAMES[i], "docente123", ["DOCENTE"]);
    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, hourlyRate: 6000 + i * 200 },
    });
    teacherProfiles.push(profile);
  }

  // 3. Aulas: una por nivel y docente rotando, más una del owner.
  const classrooms = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const teacher = pick(teacherProfiles, i);
    const name = `${LEVELS[i]} - Comisión A`;
    const classroom = await prisma.classroom.upsert({
      where: { name },
      update: {},
      create: { name, level: LEVELS[i], teacherId: teacher.id },
    });
    classrooms.push(classroom);
  }
  // segunda comisión para los primeros 3 niveles (más alumnos, institutos reales tienen varias)
  for (let i = 0; i < 3; i++) {
    const teacher = pick(teacherProfiles, i + 3);
    const name = `${LEVELS[i]} - Comisión B`;
    const classroom = await prisma.classroom.upsert({
      where: { name },
      update: {},
      create: { name, level: LEVELS[i], teacherId: teacher.id },
    });
    classrooms.push(classroom);
  }

  // 4. ~100 alumnos de prueba, distribuidos en las aulas, con pagos variados.
  const STUDENT_COUNT = 100;
  const enrollmentStatuses: EnrollmentStatus[] = ["ACTIVA", "ACTIVA", "ACTIVA", "ACTIVA", "PAUSADA", "FINALIZADA"];
  const paymentStatuses: PaymentStatus[] = ["PAGADO", "PAGADO", "PAGADO", "PENDIENTE", "VENCIDO"];

  for (let i = 0; i < STUDENT_COUNT; i++) {
    const email = `alumno${i + 1}@redbusschool.com`;
    const name = fullName(i);
    const user = await upsertUser(email, name, "alumno123", ["ALUMNO"]);
    const birthYear = 2026 - (6 + (i % 30)); // entre 6 y 35 años
    const studentData = {
      dni: `${30000000 + i}`,
      phone: `11${4000000 + i * 37}`,
      address: `Calle ${100 + i} ${pick(["", "1° A", "PB", "3° C"], i)}`.trim(),
      birthDate: new Date(birthYear, i % 12, 1 + (i % 28)),
    };
    const profile = await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: studentData,
      create: { userId: user.id, ...studentData },
    });

    const existingContacts = await prisma.emergencyContact.count({ where: { studentId: profile.id } });
    if (existingContacts === 0 && birthYear >= 2010) {
      // alumnos menores: contacto de madre/padre/tutor
      await prisma.emergencyContact.create({
        data: {
          studentId: profile.id,
          relationship: pick(RELATIONSHIPS, i),
          name: fullName(i, 7),
          phone: `11${5000000 + i * 41}`,
          email: `contacto${i + 1}@gmail.com`,
        },
      });
    }

    const classroom = pick(classrooms, i);
    await prisma.enrollment.upsert({
      where: { studentId_classroomId: { studentId: profile.id, classroomId: classroom.id } },
      update: {},
      create: { studentId: profile.id, classroomId: classroom.id, status: pick(enrollmentStatuses, i) },
    });

    // últimos 3 meses de cuotas por alumno (solo si todavía no tiene pagos cargados)
    const existingPayments = await prisma.payment.count({ where: { studentId: profile.id } });
    if (existingPayments === 0) {
      const now = new Date(2026, 6, 1); // julio 2026
      for (let m = 0; m < 3; m++) {
        const period = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const periodStr = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, "0")}`;
        const status = m === 0 ? pick(paymentStatuses, i) : "PAGADO";
        await prisma.payment.create({
          data: {
            studentId: profile.id,
            amount: 15000,
            period: periodStr,
            status,
            paidAt: status === "PAGADO" ? period : null,
            method: status === "PAGADO" ? pick(PAYMENT_METHODS, i) : null,
          },
        });
      }
    }
  }

  // 5. También inscribimos al owner como alumno en un aula, para que su vista de alumno no esté vacía.
  await prisma.enrollment.upsert({
    where: { studentId_classroomId: { studentId: ownerStudentProfile.id, classroomId: classrooms[4].id } },
    update: {},
    create: { studentId: ownerStudentProfile.id, classroomId: classrooms[4].id, status: "ACTIVA" },
  });
  const ownerHasPayments = await prisma.payment.count({ where: { studentId: ownerStudentProfile.id } });
  if (ownerHasPayments === 0) {
    await prisma.payment.create({
      data: { studentId: ownerStudentProfile.id, amount: 15000, period: "2026-07", status: "PENDIENTE" },
    });
  }

  console.log(`Listo. Usuario principal: ${ownerEmail} / ${ownerPassword} (DIRECTIVO + DOCENTE + ALUMNO)`);
  console.log(`${teacherProfiles.length} docentes, ${classrooms.length} aulas, ${STUDENT_COUNT} alumnos de prueba.`);
}

main().finally(() => prisma.$disconnect());
