import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { TenantBottomNav } from "@/components/layout/tenant-bottom-nav";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <TenantSidebar />
      {/* --sidebar-w is set by SidebarNav (collapse-aware); 16rem fallback for SSR/expanded */}
      <main className="transition-[padding] duration-300 lg:pl-[var(--sidebar-w,16rem)]">
        {/* pb-24 on mobile clears the bottom tab bar */}
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>
      <TenantBottomNav />
    </div>
  );
}
