import { getTemplates } from "@/app/actions/catalog";
import { Wizard } from "@/components/wizard/wizard";

export const dynamic = "force-dynamic";

export default async function TalepPage() {
  const templates = await getTemplates();
  return <Wizard templates={templates} />;
}
