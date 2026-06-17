"use client";

import Link from "next/link";
import Image from "next/image";

interface CaregiverCardProps {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviewsCount: number;
  location: string;
  hourlyRate: number;
  bio: string;
  verified: boolean;
  specialization?: string;
}

export default function CaregiverCard({
  id,
  name,
  avatar,
  title,
  rating,
  reviewsCount,
  location,
  hourlyRate,
  bio,
  verified,
}: CaregiverCardProps) {
  return (
    <div className="group bg-white rounded-3xl border border-sand-high/60 shadow-soft hover:shadow-premium transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1">
      {/* Card Image */}
      <div className="relative h-52 overflow-hidden bg-sand-low shrink-0">
        <Image
          src={avatar || "/avatar_1.jpg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[15%] group-hover:grayscale-0"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {}}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-3 right-3 bg-stitch-primary text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-[13px] [font-variation-settings:'FILL'_1]">
              verified
            </span>
            Verified
          </div>
        )}

        {/* Rate Badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-stitch-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md border border-stitch-outline/20">
          AED {hourlyRate}/hr
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Name & Rating */}
        <div className="flex justify-between items-start mb-1.5">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-stitch-display font-bold text-base text-[#012d1d] truncate">
              {name}
            </h3>
            <p className="text-stitch-primary text-xs font-semibold mt-0.5 truncate">
              {title}
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-amber-500">
              <span className="material-symbols-outlined text-[16px] [font-variation-settings:'FILL'_1]">
                star
              </span>
              <span className="text-[#012d1d] font-bold text-sm">{rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-stitch-on-surface-variant mt-0.5">
              ({reviewsCount} reviews)
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-stitch-on-surface-variant text-xs mb-3 mt-1">
          <span className="material-symbols-outlined text-[15px]">location_on</span>
          <span className="truncate">{location}</span>
        </div>

        {/* Bio */}
        <p className="text-stitch-on-surface-variant text-xs leading-relaxed line-clamp-2 flex-1 mb-4">
          {bio || "Professional caregiver dedicated to providing compassionate and dignified care."}
        </p>

        {/* Actions */}
        <div className="flex gap-2.5 mt-auto pt-4 border-t border-sand-high/60">
          <Link
            href={`/family/companions/${id}`}
            className="flex-1 py-2.5 text-center text-xs font-bold border border-stitch-primary text-stitch-primary rounded-xl hover:bg-stitch-primary/5 transition-all"
          >
            View Profile
          </Link>
          <Link
            href={`/family/companions/${id}#book`}
            className="flex-1 py-2.5 text-center text-xs font-bold bg-stitch-primary text-white rounded-xl hover:shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
