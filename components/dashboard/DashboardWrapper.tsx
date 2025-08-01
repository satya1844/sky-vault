"use client";

import { UserContext } from "@/context/UserContext";
import DashboardLayout from "./DashboardLayout";

type User = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
  username?: string | null;
  emailAddress?: string;
};

interface DashboardWrapperProps {
  children: React.ReactNode;
  user?: User;
}

export default function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  return (
    <UserContext.Provider value={user || null}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </UserContext.Provider>
  );
}