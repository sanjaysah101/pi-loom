import { SidebarProvider } from '@/components/ui/sidebar';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* <DashboardSidebar /> */}
        <div className="relative flex flex-1 flex-col">
          {/* <DashboardNavbar /> */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-3 md:p-4">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
