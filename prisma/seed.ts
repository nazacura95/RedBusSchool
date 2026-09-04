import { PrismaClient, EnrollmentStatus, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LEVELS = ["Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5", "Nivel 6", "Nivel 7", "Nivel 8"];

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

async function upsertUser(
  email: string,
  name: string,
  password: string,
  roles: ("ALUMNO" | "DOCENTE" | "DIRECTIVO")[],
  organizationId: string,
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { roles, name, organizationId },
    create: { email, passwordHash, name, roles, organizationId },
  });
}

type SeedOrgConfig = {
  slug: string;
  name: string;
  emailDomain: string;
  ownerName: string;
  ownerPassword: string;
  teacherNames: string[];
  studentCount: number;
  levels?: string[];
};

async function seedOrganization(config: SeedOrgConfig) {
  const { slug, name, emailDomain, ownerName, ownerPassword, teacherNames, studentCount, levels = LEVELS } = config;

  const org = await prisma.organization.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });

  // 1. Usuario principal: los 3 roles a la vez, para poder ver todas las interfaces.
  const ownerEmail = `admin@${emailDomain}`;
  const owner = await upsertUser(ownerEmail, ownerName, ownerPassword, ["DIRECTIVO", "DOCENTE", "ALUMNO"], org.id);

  const ownerTeacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: owner.id },
    update: { organizationId: org.id },
    create: { userId: owner.id, hourlyRate: 8000, organizationId: org.id },
  });
  const ownerStudentProfile = await prisma.studentProfile.upsert({
    where: { userId: owner.id },
    update: { organizationId: org.id },
    create: { userId: owner.id, organizationId: org.id },
  });

  // 2. Docentes de prueba (además del owner, que también da clases).
  const teacherProfiles = [ownerTeacherProfile];
  for (let i = 0; i < teacherNames.length; i++) {
    const email = `docente${i + 1}@${emailDomain}`;
    const user = await upsertUser(email, teacherNames[i], "docente123", ["DOCENTE"], org.id);
    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: { organizationId: org.id },
      create: { userId: user.id, hourlyRate: 6000 + i * 200, organizationId: org.id },
    });
    teacherProfiles.push(profile);
  }

  // 3. Aulas: una por nivel y docente rotando, más una del owner. Con orgs chicas (pocos
  // docentes/niveles) se recorta la cantidad de aulas para no pedir más niveles de los que hay.
  const levelCount = Math.min(levels.length, Math.max(teacherProfiles.length, 3));
  const classrooms = [];
  for (let i = 0; i < levelCount; i++) {
    const teacher = pick(teacherProfiles, i);
    // Classroom.name todavía es único GLOBAL (la migración B, que lo pasa a único por
    // organización, se aplica recién después del backfill — ver plan de migración). Hasta
    // entonces, el seed tiene que garantizar nombres únicos a mano entre organizaciones.
    const classroomName = `${levels[i]} - Comisión A (${slug})`;
    const classroom = await prisma.classroom.upsert({
      where: { name: classroomName },
      update: { organizationId: org.id },
      create: { name: classroomName, level: levels[i], teacherId: teacher.id, organizationId: org.id },
    });
    classrooms.push(classroom);
  }
  // segunda comisión para los primeros niveles, solo si la organización es grande (Red Bus)
  const extraComisiones = studentCount >= 50 ? 3 : 0;
  for (let i = 0; i < extraComisiones; i++) {
    const teacher = pick(teacherProfiles, i + 3);
    const classroomName = `${levels[i]} - Comisión B (${slug})`;
    const classroom = await prisma.classroom.upsert({
      where: { name: classroomName },
      update: { organizationId: org.id },
      create: { name: classroomName, level: levels[i], teacherId: teacher.id, organizationId: org.id },
    });
    classrooms.push(classroom);
  }

  // 4. Alumnos de prueba, distribuidos en las aulas, con pagos variados.
  const enrollmentStatuses: EnrollmentStatus[] = ["ACTIVA", "ACTIVA", "ACTIVA", "ACTIVA", "PAUSADA", "FINALIZADA"];
  const paymentStatuses: PaymentStatus[] = ["PAGADO", "PAGADO", "PAGADO", "PENDIENTE", "VENCIDO"];

  for (let i = 0; i < studentCount; i++) {
    const email = `alumno${i + 1}@${emailDomain}`;
    const studentName = fullName(i);
    const user = await upsertUser(email, studentName, "alumno123", ["ALUMNO"], org.id);
    const birthYear = 2026 - (6 + (i % 30)); // entre 6 y 35 años
    const studentData = {
      dni: `${slug}-${30000000 + i}`,
      phone: `11${4000000 + i * 37}`,
      address: `Calle ${100 + i} ${pick(["", "1° A", "PB", "3° C"], i)}`.trim(),
      birthDate: new Date(birthYear, i % 12, 1 + (i % 28)),
      organizationId: org.id,
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
            organizationId: org.id,
          },
        });
      }
    }
  }

  // 5. También inscribimos al owner como alumno en un aula, para que su vista de alumno no esté vacía.
  const ownerClassroom = classrooms[Math.min(4, classrooms.length - 1)];
  await prisma.enrollment.upsert({
    where: { studentId_classroomId: { studentId: ownerStudentProfile.id, classroomId: ownerClassroom.id } },
    update: {},
    create: { studentId: ownerStudentProfile.id, classroomId: ownerClassroom.id, status: "ACTIVA" },
  });
  const ownerHasPayments = await prisma.payment.count({ where: { studentId: ownerStudentProfile.id } });
  if (ownerHasPayments === 0) {
    await prisma.payment.create({
      data: {
        studentId: ownerStudentProfile.id,
        amount: 15000,
        period: "2026-07",
        status: "PENDIENTE",
        organizationId: org.id,
      },
    });
  }

  console.log(`[${slug}] Listo. Usuario principal: ${ownerEmail} / ${ownerPassword} (DIRECTIVO + DOCENTE + ALUMNO)`);
  console.log(`[${slug}] ${teacherProfiles.length} docentes, ${classrooms.length} aulas, ${studentCount} alumnos.`);
}

// Institutos de prueba: variados a propósito (idiomas, colegio, música, tech, fitness) para
// demostrar que Bedel sirve a distintos rubros, no solo institutos de inglés. Todos con datos
// ficticios — ninguno es un cliente real. Sirven para probar aislamiento con carga de varios
// tenants a la vez (ver plan de migración a Bedel).
const DEMO_ORGS: SeedOrgConfig[] = [
  {
    slug: "demo-academy",
    name: "Demo Academy",
    emailDomain: "demoacademy.com",
    ownerName: "Carla Mendez",
    ownerPassword: "cambiar123",
    teacherNames: ["Pablo Ibáñez", "Rocío Paz"],
    studentCount: 10,
  },
  {
    slug: "continental",
    name: "Academia Continental de Idiomas",
    emailDomain: "continentalidiomas.com",
    ownerName: "Mariana Gutiérrez",
    ownerPassword: "cambiar123",
    teacherNames: ["Diego Salvatierra", "Florencia Nuñez", "Martín Ocampo"],
    studentCount: 34,
    levels: ["Nivel 1", "Nivel 2", "Nivel 3", "Nivel 4", "Nivel 5"],
  },
  {
    slug: "sanmartin",
    name: "Instituto San Martín",
    emailDomain: "institutosanmartin.edu.ar",
    ownerName: "Roberto Aguirre",
    ownerPassword: "cambiar123",
    teacherNames: ["Silvina Correa", "Gustavo Peralta", "Laura Vidal", "Emiliano Bravo"],
    studentCount: 48,
    levels: ["1° Año", "2° Año", "3° Año", "4° Año", "5° Año"],
  },
  {
    slug: "conservatorionova",
    name: "Conservatorio Nova",
    emailDomain: "conservatorionova.com",
    ownerName: "Valeria Sarmiento",
    ownerPassword: "cambiar123",
    teacherNames: ["Hernán Duarte", "Cecilia Lamas"],
    studentCount: 16,
    levels: ["Piano Inicial", "Piano Intermedio", "Guitarra Inicial", "Canto"],
  },
  {
    slug: "codelab",
    name: "CodeLab Bootcamp",
    emailDomain: "codelabbootcamp.com",
    ownerName: "Tomás Villalba",
    ownerPassword: "cambiar123",
    teacherNames: ["Agustina Ferreyra", "Braian Coronel"],
    studentCount: 22,
    levels: ["Fundamentos", "Frontend", "Backend", "Proyecto Final"],
  },
  {
    slug: "pilatesflow",
    name: "Estudio Pilates Flow",
    emailDomain: "pilatesflow.com",
    ownerName: "Ayelén Roldán",
    ownerPassword: "cambiar123",
    teacherNames: ["Nadia Quiroga"],
    studentCount: 12,
    levels: ["Principiantes", "Intermedio", "Avanzado"],
  },
];

async function main() {
  // Red Bus: la organización real, con el volumen de datos de siempre.
  await seedOrganization({
    slug: "redbus",
    name: "Redbus School of English",
    emailDomain: "redbusschool.com",
    ownerName: "Nazareno Cura",
    ownerPassword: process.env.SEED_ADMIN_PASSWORD ?? "cambiar123",
    teacherNames: [
      "Marina Sosa",
      "Lucas Fernández",
      "Camila Torres",
      "Ezequiel Romero",
      "Julieta Acosta",
      "Nicolás Herrera",
    ],
    studentCount: 100,
  });

  for (const org of DEMO_ORGS) {
    await seedOrganization(org);
  }
}

main().finally(() => prisma.$disconnect());
