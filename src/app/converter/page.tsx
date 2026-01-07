import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ConverterLoader from "@/components/converter/ConverterLoader";

export default async function ConverterPage(): Promise<React.JSX.Element> {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return <ConverterLoader user={session.user} />;
}
