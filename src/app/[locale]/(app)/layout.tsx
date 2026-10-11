import { requireUser } from "@/core/auth/session";
import { filterNav } from "@/core/nav-permissions";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const groups = await filterNav(user);
  return <AppShell groups={groups} user={user}>{children}</AppShell>;
}