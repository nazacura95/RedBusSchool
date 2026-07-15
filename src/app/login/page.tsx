import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Bus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

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
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col items-center justify-center bg-primary-600 px-12 text-white lg:flex">
        <div className="flex items-center gap-2 self-start">
          <Bus className="h-7 w-7" />
          <span className="text-lg font-bold">Red Bus School</span>
        </div>
        <p className="max-w-sm text-center text-3xl font-bold leading-tight">
          Tu instituto, en un solo lugar
        </p>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-neutral-900">Iniciar sesión</h1>
            <p className="text-sm text-neutral-500">Ingresá tus datos para acceder a tu panel.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
              Email o contraseña incorrectos.
            </div>
          )}

          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Ingresar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
