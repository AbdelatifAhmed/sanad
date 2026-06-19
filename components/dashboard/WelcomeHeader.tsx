import React from "react";

interface WelcomeHeaderProps {
  userName: string;
  userAvatar: string;
}

export default function WelcomeHeader({ userName, userAvatar }: WelcomeHeaderProps) {
  return (
    <div className="flex justify-between items-center bg-white p-6 md:p-8 rounded-3xl border border-sand-high/60 shadow-soft">
      <div className="space-y-1">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[#012d1d]">
          Good morning, {userName}
        </h1>
        <p className="text-gray-500 text-sm md:text-base font-medium">
          Here is a summary of your ongoing care arrangements.
        </p>
      </div>
      <div className="relative group cursor-pointer">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-primary/10 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30">
          <img 
            src={userAvatar} 
            alt={userName} 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </div>
  );
}
