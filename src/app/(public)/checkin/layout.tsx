import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/guards";

export default async function CheckInLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireStaff();
  } catch {
    redirect("/staff/login?next=/checkin");
  }

  return children;
}
