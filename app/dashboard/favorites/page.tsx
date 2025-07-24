import Favorites from "@/components/dashboard/Favorites";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function FavoritesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return <Favorites userId={userId} />;
}