import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConverterClient } from "@/components/converter-client";

export default async function ConverterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <ConverterClient user={session.user} />;
}
