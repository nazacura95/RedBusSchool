import { logout } from "@/lib/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="block w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-neutral-50"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
