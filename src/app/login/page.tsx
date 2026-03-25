import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { LoginPanels } from "./panels";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "ADMIN") redirect("/admin");
  if (session?.user?.role === "CREW") redirect("/crew");

  return <LoginPanels />;
}

