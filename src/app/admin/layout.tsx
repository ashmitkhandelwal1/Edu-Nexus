import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // If not authenticated, redirect to login
  if (!user) {
    redirect("/login");
  }

  // If authenticated but not an admin, redirect to unauthorized
  if (user.role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
