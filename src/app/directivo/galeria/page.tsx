import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { GalleryManager } from "./gallery-manager";
import { TestimonialsManager } from "./testimonials-manager";

export default async function GaleriaPage() {
  const session = await auth();
  const [images, testimonials] = await Promise.all([
    prisma.siteImage.findMany({ orderBy: { order: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <AppShell roles={session!.user.roles} name={session!.user.name} title="Galería">
      <GalleryManager initialImages={images} />
      <TestimonialsManager initialTestimonials={testimonials} />
    </AppShell>
  );
}
