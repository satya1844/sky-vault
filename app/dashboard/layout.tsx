import { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function DashboardLayoutWrapper({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}