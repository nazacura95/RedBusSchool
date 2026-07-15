import { LogoutButton } from "./logout-button";

export function Header({ title, name }: { title: string; name: string }) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">Red Bus School</h1>
        <p className="text-sm text-neutral-500">{title}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-700">{name}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
