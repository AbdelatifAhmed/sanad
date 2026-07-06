import { serverFetch } from "@/lib/serverAuth";
import ClientCompanionsView from "./ClientCompanionsView";

export const metadata = {
  title: "Find Companions | Sanad",
  description: "Browse and find the best caregivers and companions on Sanad.",
};

export default async function FamilyCompanionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Extract pagination and filters from searchParams if needed
  const page = typeof searchParams.page === "string" ? searchParams.page : "1";
  const limit = typeof searchParams.limit === "string" ? searchParams.limit : "9";

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
