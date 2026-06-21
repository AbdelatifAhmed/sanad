import MyApplicationsList from "@/components/companion/MyApplicationsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Applications | SANAD",
  description: "Track and manage your submitted care applications and status updates.",
};

export default function CompanionApplicationsPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F6]/30">
      <MyApplicationsList />
    </div>
  );
}
