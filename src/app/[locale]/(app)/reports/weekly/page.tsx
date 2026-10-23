import { ReportsView } from "@/components/reports/reports-view";

export const dynamic = "force-dynamic";

export default async function WeeklyReportsPage() {
  return <ReportsView period="weekly" />;
}
