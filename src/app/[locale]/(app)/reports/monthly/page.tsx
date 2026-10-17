import { ReportsView } from "@/components/reports/reports-view";

export const dynamic = "force-dynamic";

export default async function MonthlyReportsPage() {
  return <ReportsView period="monthly" />;
}
