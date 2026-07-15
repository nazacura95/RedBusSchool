import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Bus,
  Users,
  BookOpen,
  Heart,
  Camera,
  MessageCircle,
  AtSign,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/stat-tile";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { LandingNav } from "@/components/landing-nav";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/?error=1#login");
    }
    throw error;
  }
}

const niveles = [
  { badge: "Kids (6-10 años)", text: "Primeras palabras y juegos en inglés" },
  { badge: "Teens (11-15)", text: "Conversación y gramática para la escuela" },
  { badge: "Adultos Principiantes", text: "Arrancá de cero, a tu ritmo" },
  { badge: "Intermedio", text: "Fluidez para el día a día" },
  { badge: "Avanzado", text: "Conversación y preparación de exámenes" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const [alumnos, docentes, images] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.siteImage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* Hero */}
      <section className="bg-primary-50 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
              Instituto de inglés
            </span>
            <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-4xl">
              Aprender inglés, de cerca.
            </h1>
            <p className="mt-4 text-lg text-neutral-600">
              Clases con profesoras que además de enseñar, escuchan. Acompañamos a chicos y
              adultos a hablar inglés con confianza.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LinkButton href="#contacto" size="lg">
                Quiero inscribirme
              </LinkButton>
              <LinkButton href="#login" variant="secondary" size="lg">
                Ya soy alumno, ingresar
              </LinkButton>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3">
              <StatTile label="Alumnos" value={alumnos > 0 ? `${alumnos}+` : "150+"} icon={Users} tone="primary" />
              <StatTile label="Profesores" value={docentes > 0 ? docentes : 7} icon={BookOpen} tone="accent" />
              <StatTile label="Años" value="10+" icon={Heart} tone="info" />
            </div>
          </div>
          <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl bg-neutral-100">
            <Bus className="h-16 w-16 text-neutral-300" />
            <p className="mt-2 text-sm text-neutral-400">Foto próximamente</p>
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section id="quienes-somos" className="mx-auto max-w-5xl px-4 py-16">
        <p className="text-sm font-semibold uppercase text-primary-600">Quiénes somos</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">
          Un instituto de barrio, con estructura de escuela grande
        </h2>
        <p className="mt-4 max-w-2xl text-neutral-600">
          Somos Red Bus School: un equipo de 7 profesores —incluidas nosotras, las dueñas, que
          seguimos dando clases todas las semanas— para unos 150 alumnos de todas las edades.
          Dejamos atrás los cuadernos de papel: acá todo queda registrado, así que padres y
          alumnos siempre saben cómo viene el proceso.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <Users className="h-6 w-6 text-primary-600" />
            <h3 className="mt-3 font-semibold text-neutral-900">Grupos reducidos</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Clases pensadas para que cada alumno hable, no solo escuche.
            </p>
          </Card>
          <Card>
            <BookOpen className="h-6 w-6 text-primary-600" />
            <h3 className="mt-3 font-semibold text-neutral-900">Seguimiento real</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Registro digital de asistencia, tareas y progreso, sin cuadernos perdidos.
            </p>
          </Card>
          <Card>
            <Heart className="h-6 w-6 text-primary-600" />
            <h3 className="mt-3 font-semibold text-neutral-900">Trato cercano</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Profesoras que conocen a cada alumno por su nombre.
            </p>
          </Card>
        </div>
      </section>

      {/* Niveles */}
      <section id="niveles" className="bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase text-primary-600">Niveles</p>
          <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">
            Un camino claro, desde cero hasta fluidez
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {niveles.map((n) => (
              <Card key={n.badge}>
                <Badge tone="neutral">{n.badge}</Badge>
                <p className="mt-3 text-sm text-neutral-600">{n.text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <LinkButton href="#contacto" variant="secondary">
              Ver todos los horarios
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section id="galeria" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-semibold uppercase text-primary-600">Galería</p>
        <h2 className="mt-2 text-2xl font-bold text-neutral-900 md:text-3xl">
          Así se vive Red Bus School
        </h2>

        {images.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt={img.caption ?? "Foto de Red Bus School"}
                className="h-48 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        ) : (
          <Card className="mt-10 border-2 border-dashed border-neutral-200 bg-neutral-50 py-16 px-8 text-center">
            <Camera className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-medium text-neutral-500">
              Muy pronto vas a poder ver fotos de nuestras clases y eventos acá.
            </p>
            <p className="mt-1 text-sm text-neutral-400">Estamos armando el álbum — volvé pronto.</p>
          </Card>
        )}
      </section>

      {/* CTA / Contacto */}
      <section id="contacto" className="bg-primary-600 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl font-bold text-white md:text-3xl">¿Querés sumarte?</h2>
          <p className="mt-3 text-primary-50">
            Escribinos por WhatsApp o pasá por el instituto. Te contamos los horarios disponibles
            y te ayudamos a elegir el nivel.
          </p>
          <LinkButton
            href="https://wa.me/5491100000000"
            variant="white"
            size="lg"
            className="mt-8"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-5 w-5" />
            Escribir por WhatsApp
          </LinkButton>
          <p className="mt-6 text-sm text-primary-100">
            Av. Ejemplo 1234 · Lun a Vie 9 a 20 hs · (011) 4000-0000
          </p>
        </div>
      </section>

      {/* Login */}
      <section id="login" className="bg-white py-16">
        <div className="mx-auto max-w-md px-4">
          <Card className="p-8 shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Bus className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-center text-xl font-bold text-neutral-900">
              Ingresá a tu cuenta
            </h2>
            <p className="mt-1 text-center text-sm text-neutral-500">
              Alumnos, docentes y directivos usan el mismo acceso.
            </p>

            {error && (
              <div className="mt-6 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
                Email o contraseña incorrectos.
              </div>
            )}

            <form action={login} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <span className="cursor-not-allowed text-xs font-medium text-primary-600">
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" size="lg" className="w-full">
                Ingresar
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 py-10 text-neutral-300">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Bus className="h-6 w-6 text-primary-500" />
                <span className="font-bold text-white">Red Bus School</span>
              </div>
              <p className="mt-3 text-sm">Instituto de inglés de barrio, con seguimiento real.</p>
            </div>
            <div>
              <p className="font-semibold text-white">Enlaces</p>
              <nav className="mt-3 flex flex-col gap-2 text-sm">
                <a href="#quienes-somos" className="hover:text-white">Quiénes somos</a>
                <a href="#niveles" className="hover:text-white">Niveles</a>
                <a href="#galeria" className="hover:text-white">Galería</a>
                <a href="#contacto" className="hover:text-white">Contacto</a>
              </nav>
            </div>
            <div>
              <p className="font-semibold text-white">Contacto</p>
              <div className="mt-3 space-y-1 text-sm">
                <p>Av. Ejemplo 1234</p>
                <p>(011) 4000-0000</p>
                <p>hola@redbusschool.com</p>
              </div>
              <div className="mt-4 flex gap-4">
                <AtSign className="h-5 w-5" />
                <Share2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-neutral-800 pt-6 text-center text-xs text-neutral-500">
            © 2026 Red Bus School. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
