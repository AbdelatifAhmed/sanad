import { SupportPage } from "../../../features/admin-support";

export const metadata = {
  title: "Contact Admin — Sanad",
  description: "Contact the Sanad admin team for support, complaints, or inquiries.",
};

export default function FamilySupportPage() {
  return <SupportPage userRole="family" />;
}
