import { getConfig } from "@/lib/config";
import { KioskDisplay } from "@/components/kiosk/kiosk-display";

export const dynamic = "force-dynamic";

export default async function KioskPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const config = await getConfig();
  const { page } = await searchParams;

  return (
    <div className="dark cursor-none overflow-hidden">
      <KioskDisplay initialConfig={config} singlePage={page || null} />
    </div>
  );
}
