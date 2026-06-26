import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { Sidebar } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="pl-56">
        {/* Top header */}
        <header className="sticky top-0 z-header flex h-14 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
