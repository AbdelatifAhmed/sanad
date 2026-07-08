import { serverFetch } from "@/lib/serverAuth";
import ClientCompanionsView from "./ClientCompanionsView";

export const metadata = {
  title: "Find Companions | Sanad",
  description: "Browse and find the best caregivers and companions on Sanad.",
};

export default async function FamilyCompanionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  // Extract pagination and filters from searchParams if needed
  const page = typeof resolvedParams?.page === "string" ? resolvedParams.page : "1";
  const limit = typeof resolvedParams?.limit === "string" ? resolvedParams.limit : "20";

  let initialData = null;
  try {
    // Fetch initial list of companions Server-Side
    initialData = await serverFetch(`/companion?page=${page}&limit=${limit}`);
  } catch (error) {
    console.error("Failed to fetch initial companions on server:", error);
  }

  return (
    <main>
      <ClientCompanionsView initialData={initialData} />
    </main>
  );
}
