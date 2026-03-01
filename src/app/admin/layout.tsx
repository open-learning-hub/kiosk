import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Kiosk Admin</h1>
            <Link
              href="/"
              target="_blank"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Open Kiosk →
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
