import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/DashboardContent";
import DashboardWrapper from "@/components/dashboard/DashboardWrapper";

export default async function Dashboard() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const serializedUser = user ? {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    username: user.username,
    emailAddress: user.emailAddresses?.[0]?.emailAddress
  } : undefined;

  return (
    <DashboardWrapper user={serializedUser}>
      <DashboardContent user={serializedUser} />
    </DashboardWrapper>
  );
}