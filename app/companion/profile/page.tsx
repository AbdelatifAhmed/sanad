import EditableProfile from "@/components/companion/EditableProfile";
import { serverFetch } from "@/lib/serverAuth";

async function getCompanionProfile() {
  try {
    const data = await serverFetch("/companion/me", {
      cache: "no-store",
    });
    return data.companion;
  } catch (err) {
    console.error("Failed to fetch companion profile in SSR:", err);
    return null;
  }
}

export default async function CompanionProfilePage() {
  const initialData = await getCompanionProfile();

  return (
    <div className="w-full">
      <EditableProfile initialData={initialData} />
    </div>
  );
}
