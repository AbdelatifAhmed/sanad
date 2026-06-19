import { Star, MapPin, Award, CheckCircle } from "lucide-react";

interface RequestCaregiverHeaderProps {
  name: string;
  avatar: string;
  title: string;
  experience: string;
  location: string;
  bio: string;
  rating: number;
  verified: boolean;
}

export default function RequestCaregiverHeader({
  name = "Amina Al-Farsi",
  avatar = "/avatar_3.jpg",
  title = "Registered Nurse (RN)",
  experience = "10+ Years Experience",
  location = "Muscat, Oman",
  bio = "Providing dignified, professional care with an empathetic touch to ensure your family's comfort.",
  rating = 4.9,
  verified = false,
}: Partial<RequestCaregiverHeaderProps>) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
      {/* Avatar Container with Rating Badge */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-sand-high shadow-sm bg-sand-low">
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        {/* Rating Badge */}
        <div className="absolute -bottom-2 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-[-8px] bg-[#012d1d] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-bold border border-sand-high shadow-md">
          <Star className="w-3 h-3 fill-current text-amber-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Info Details */}
      <div className="flex-1 text-center sm:text-left space-y-2 mt-2 sm:mt-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
          <h2 className="font-display text-2xl font-bold text-[#012d1d]">
            Request Care from {name}
          </h2>
          {verified && (
            <span className="w-fit mx-auto sm:mx-0 flex items-center gap-1 bg-[#e6f4f2] text-[#005c53] font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#005c53]/10">
              <CheckCircle className="w-3.5 h-3.5 fill-[#005c53] text-white" />
              Verified
            </span>
          )}
        </div>
        
        {/* Badges/Tags */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
          <span className="bg-[#e6f4f2] text-[#005c53] text-xs font-bold px-3 py-1 rounded-full border border-[#005c53]/10">
            {title}
          </span>
          <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
            <Award className="w-4 h-4 text-gray-400" />
            <span>{experience}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{location}</span>
          </div>
        </div>

        {/* Bio Quote */}
        <p className="text-gray-500 text-sm italic font-medium pt-1 max-w-2xl leading-relaxed">
          &ldquo;{bio}&rdquo;
        </p>
      </div>
    </div>
  );
}
