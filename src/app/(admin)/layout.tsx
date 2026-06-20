import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <AdminSidebar />
      {/* --sidebar-w is set by SidebarNav (collapse-aware); 16rem fallback for SSR/expanded */}
      <main className="transition-[padding] duration-300 lg:pl-[var(--sidebar-w,16rem)]">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
