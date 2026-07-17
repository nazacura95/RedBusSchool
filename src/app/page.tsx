import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Heart,
  Camera,
  MessageCircle,
  AtSign,
  Share2,
  Landmark,
  Coffee,
  Bus,
  Baby,
  TrendingUp,
  Award,
  LucideIcon,
} from "lucide-react";
import { LandingNav } from "@/components/landing-nav";
import { LinkButton } from "@/components/ui/link-button";
import { Card } from "@/components/ui/card";
import { LeadForm } from "./lead-form";

const niveles: { badge: string; text: string; icon: LucideIcon }[] = [
  { badge: "Kids (6-10 años)", text: "Primeras palabras y juegos en inglés", icon: Baby },
  { badge: "Teens (11-15)", text: "Conversación y gramática para la escuela", icon: Users },
  { badge: "Adultos Principiantes", text: "Arrancá de cero, a tu ritmo", icon: BookOpen },
  { badge: "Intermedio", text: "Fluidez para el día a día", icon: TrendingUp },
  { badge: "Avanzado", text: "Conversación y preparación de exámenes", icon: Award },
];

const placeholderGallery = [
  "https://images.pexels.com/photos/6502822/pexels-photo-6502822.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/29242202/pexels-photo-29242202.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/5212342/pexels-photo-5212342.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/29253498/pexels-photo-29253498.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/28905449/pexels-photo-28905449.jpeg?auto=compress&cs=tinysrgb&w=1000",
];

// Mosaic pattern for a 5-photo cycle: big tile, two small, two wide.
const gallerySpans = [
  "col-span-2 row-span-2",
  "",
  "",
  "col-span-2",
  "col-span-2",
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const [alumnos, docentes, images] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.siteImage.findMany({ orderBy: { order: "asc" } }),
  ]);

  const gallery =
    images.length > 0
      ? images.map((img) => ({ url: img.url, caption: img.caption ?? "Redbus School" }))
      : placeholderGallery.map((url) => ({ url, caption: "Redbus School" }));
  const heroImage = images[0]?.url ?? placeholderGallery[0];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            Instituto de inglés · José C. Paz
          </span>
          <h1 className="mt-4 text-[clamp(38px,5.4vw,64px)] font-semibold leading-[1.05] text-neutral-800">
            Aprender inglés, de <em className="italic text-primary-500">cerca.</em>
          </h1>
          <p className="mt-4 max-w-[480px] text-lg text-neutral-700">
            Clases con profesoras que además de enseñar, escuchan. Acompañamos a chicos y
            adultos a hablar inglés con confianza.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <LinkButton href="#contacto" variant="primary" size="lg">
              Quiero inscribirme
            </LinkButton>
            <Link href="/login" className="text-base font-semibold text-accent-500 hover:underline">
              Ya soy alumno, ingresar →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3">
            <div>
              <p className="font-serif text-[30px] font-bold text-accent-500">
                {alumnos > 0 ? `${alumnos}+` : "150+"}
              </p>
              <p className="text-xs uppercase tracking-wide text-neutral-600">Alumnos</p>
            </div>
            <div>
              <p className="font-serif text-[30px] font-bold text-accent-500">
                {docentes > 0 ? docentes : 7}
              </p>
              <p className="text-xs uppercase tracking-wide text-neutral-600">Profesores</p>
            </div>
            <div>
              <p className="font-serif text-[30px] font-bold text-accent-500">10+</p>
              <p className="text-xs uppercase tracking-wide text-neutral-600">Años</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-4 -z-10 rounded-[24px]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg,#1B2A56 0 22px,#C8102E 22px 44px,#FBF7EF 44px 50px)",
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt="Alumno tomando clase de inglés con su profesora"
            className="aspect-[4/5] w-full rounded-[20px] object-cover shadow-lg"
          />
          <div className="absolute -bottom-5 left-1/2 flex w-max -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-accent-500 shadow-lg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
              <Bus className="h-3.5 w-3.5" />
            </span>
            Desde 2019 · de barrio, para el barrio
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section id="quienes-somos" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.pexels.com/photos/5212342/pexels-photo-5212342.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Profesora dando clase de inglés a un grupo de alumnos"
              className="aspect-[4/3] w-full rounded-[20px] object-cover shadow-lg"
            />
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-accent-500/90 px-4 py-3 text-sm font-medium text-white backdrop-blur">
              🎓 Raíces británicas · Colectivo de dos pisos, nuestro sello
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-500">Quiénes somos</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-800 md:text-3xl">
              Un instituto de barrio, con estructura de escuela grande
            </h2>
            <p className="mt-4 text-neutral-700">
              Somos Redbus School of English: un equipo de 7 profesores —incluidas nosotras, las
              dueñas, que seguimos dando clases todas las semanas— para unos 150 alumnos de
              todas las edades. Dejamos atrás los cuadernos de papel: acá todo queda registrado,
              así que padres y alumnos siempre saben cómo viene el proceso.
            </p>
            <p className="mt-4 text-neutral-700">
              Además de las clases, organizamos charlas de práctica estilo &quot;tea time&quot;:
              un ratito relajado para animarse a hablar, tomar algo rico y perderle el miedo al
              inglés en grupo.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Landmark className="h-5 w-5 text-primary-500" />
                Programa con raíces británicas
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Bus className="h-5 w-5 text-primary-500" />
                El clásico colectivo de dos pisos
              </span>
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Coffee className="h-5 w-5 text-primary-500" />
                Charlas estilo &quot;tea time&quot;
              </span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Users, title: "Grupos reducidos", text: "Clases pensadas para que cada alumno hable, no solo escuche." },
            { icon: BookOpen, title: "Seguimiento real", text: "Registro digital de asistencia, tareas y progreso, sin cuadernos perdidos." },
            { icon: Heart, title: "Trato cercano", text: "Profesoras que conocen a cada alumno por su nombre." },
          ].map((f) => (
            <Card key={f.title} className="rounded-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-500">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-neutral-800">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-700">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Niveles */}
      <section id="niveles" className="bg-accent-500 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-100">Niveles</p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            Un camino claro, desde cero hasta fluidez
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {niveles.map((n, i) => (
              <div key={n.badge} className="rounded-lg border border-white/14 bg-white/6 p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 font-serif text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-serif font-semibold text-white">{n.badge}</h3>
                <p className="mt-2 text-sm text-accent-100">{n.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <LinkButton href="#contacto" variant="primary">
              Ver todos los horarios
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section id="galeria" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-500">Galería</p>
        <h2 className="mt-2 text-2xl font-semibold text-neutral-800 md:text-3xl">
          Así se vive Redbus School of English
        </h2>

        <div className="mt-10 grid auto-rows-[170px] grid-cols-2 gap-3 md:grid-cols-4">
          {gallery.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.url + i}
              src={img.url}
              alt={img.caption}
              className={`h-full w-full rounded-lg object-cover ${gallerySpans[i % gallerySpans.length]}`}
            />
          ))}
        </div>

        {images.length === 0 && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-600">
            <Camera className="h-4 w-4" />
            Muy pronto vas a poder ver fotos reales de nuestras clases y eventos acá.
          </p>
        )}
      </section>

      {/* Contacto */}
      <section id="contacto" className="bg-neutral-100 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-500">Contacto</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-800 md:text-3xl">¿Querés sumarte?</h2>
            <p className="mt-3 text-neutral-700">
              Dejanos tus datos y te contamos los horarios disponibles y te ayudamos a elegir el
              nivel.
            </p>

            <div className="mt-6">
              <LeadForm />
            </div>

            <a
              href="https://wa.me/5491151385114"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-[#25A055] px-5 py-3 text-sm font-semibold text-[#1B7A3D] transition-colors hover:bg-[#25A055]/10"
            >
              <MessageCircle className="h-4 w-4" />
              ¿Preferís escribirnos directo? Hablanos por WhatsApp →
            </a>
          </div>

          <Card className="rounded-[20px] border-0 bg-accent-500 p-8 text-accent-100">
            <h3 className="text-xl font-semibold text-white">Encontranos</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p>Av. Croacia 2499-2569, B1666KDM José C. Paz, Buenos Aires</p>
              <p>Lun a Vie 9 a 20 hs</p>
              <p>hola@redbusschool.com</p>
            </div>
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                "Redbus School of English, Av. Croacia 2499-2569, B1666KDM José C. Paz, Buenos Aires, Argentina"
              )}&output=embed`}
              width="100%"
              height="220"
              style={{ border: 0 }}
              loading="lazy"
              className="mt-6 rounded-lg"
            />
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 py-10 text-neutral-400">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Image src="/brand/logo-256.png" alt="Redbus School of English" width={28} height={28} className="h-7 w-7 rounded-full" />
                <span className="font-serif font-bold text-white">Redbus School of English</span>
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
                <p>Av. Croacia 2499-2569, José C. Paz</p>
                <p>+54 9 11 5138-5114</p>
                <p>hola@redbusschool.com</p>
              </div>
              <div className="mt-4 flex gap-4">
                <AtSign className="h-5 w-5" />
                <Share2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-neutral-800 pt-6 text-center text-xs">
            © 2026 Redbus School of English. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
