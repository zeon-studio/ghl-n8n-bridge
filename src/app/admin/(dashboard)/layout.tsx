import { getAdminSession } from "@/lib/admin/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AdminHeader } from "./components/AdminHeader";
import { AdminSidebar } from "./components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const isAuthenticated = await getAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop fixed sidebar */}
      <AdminSidebar className="hidden md:flex" />

      {/* Main scrollable view */}
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
