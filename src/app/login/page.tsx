import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RolePicker } from "./role-picker";

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
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo-256.png" alt="Redbus School" width={44} height={44} className="h-11 w-11 rounded-full" />
          <span className="font-serif text-[19px] font-bold text-neutral-800">
            Redbus <span className="text-primary-500">School</span>
          </span>
        </Link>
        <LinkButton href="/" variant="secondary">
          ← Volver al sitio
        </LinkButton>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-[20px] bg-white p-8 shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <Image src="/brand/logo-256.png" alt="Redbus School" width={64} height={64} className="h-16 w-16" />
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold text-neutral-800">Ingresá a tu cuenta</h2>

          <RolePicker />

          {error && (
            <div className="mt-4 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">
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
                <Link href="/recuperar" className="text-xs font-medium text-primary-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <PasswordInput id="password" name="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Ingresar
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-500">
            ¿Primera vez que entrás?{" "}
            <Link href="/recuperar" className="font-medium text-primary-500 hover:underline">
              Activá tu cuenta y elegí tu contraseña
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
