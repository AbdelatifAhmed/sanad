import { getAvatarUrl } from "@/lib/avatar";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

interface WelcomeHeaderProps {
  userName: string;
  userAvatar: any;
}

export default async function WelcomeHeader({ userName, userAvatar }: WelcomeHeaderProps) {
  const t = await getTranslations("familyDashboard");
  
  // Resolve avatar URL without fallback
  const resolvedAvatar = getAvatarUrl(userAvatar);

  // Extract first two letters
  const initials = userName
    ? userName.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "US";

  return (
    <div className="flex justify-between items-center w-full">
      <div className="space-y-1">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#012d1d]">
          {t("greeting", { name: userName })}
        </h1>
        <p className="text-gray-500 text-sm md:text-base font-medium">
          {t("summaryText")}
        </p>
      </div>
      <Link href="/family/profile" className="relative group cursor-pointer block shrink-0">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/10 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30 relative flex items-center justify-center bg-stitch-primary text-white font-bold text-lg md:text-xl">
          {resolvedAvatar ? (
            <Image 
              src={resolvedAvatar} 
              alt={userName} 
              fill
              className="w-full h-full object-cover" 
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </Link>
    </div>
  );
}
