import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch {
    redirect("/staff/login?next=/admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
