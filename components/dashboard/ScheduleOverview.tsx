import Link from "next/link";

export interface TaskItem {
  taskDescription: string;
  isCompleted: boolean;
  _id?: string;
}

export interface ScheduleSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  tasksList: TaskItem[];
}

export interface Booking {
  _id: string;
  familyId: {
    _id: string;
    name: string;
    phoneNumber?: string;
    email?: string;
    avatar?: string | null;
  } | null;
  status: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleSlot[];
}

interface FlatScheduleItem {
  id: string;
  bookingId: string;
  family: {
    name: string;
    phoneNumber: string;
    email: string;
    avatar: string | null;
  };
  date: Date;
  startTime: string;
  endTime: string;
  tasks: TaskItem[];
  status: string;
  durationMin: number;
}

interface ScheduleOverviewProps {
  schedule: Booking[];
  viewMode: "list" | "timeline";
}

// --- Helper Functions ---
const calculateDuration = (start: string, end: string): number => {
  try {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    const totalStart = startH * 60 + startM;
    const totalEnd = endH * 60 + endM;
    return Math.max(0, totalEnd - totalStart);
  } catch {
    return 60; // fallback duration
  }
};

const getLocalDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getBgColorForName = (name: string): string => {
  const colors = [
    "bg-red-100 text-red-800",
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getBadgeStyles = (task: string): string => {
  const lower = task.toLowerCase();
  if (lower.includes("medication") || lower.includes("check")) {
    return "bg-[#aeedd5]/30 text-[#316d5b]";
  }
  if (lower.includes("post-op") || lower.includes("support") || lower.includes("therapy")) {
    return "bg-amber-100/50 text-amber-800";
  }
  return "bg-stitch-primary/10 text-stitch-primary";
};

export function ScheduleOverview({ schedule, viewMode }: ScheduleOverviewProps) {
  // Flatten and process the schedule slots
  const flattenSchedule = (bookings: Booking[]): FlatScheduleItem[] => {
    const flatItems: FlatScheduleItem[] = [];

    bookings.forEach((booking) => {
      if (!booking.schedule || !Array.isArray(booking.schedule)) return;
      const family = booking.familyId || {
        name: "Unknown Patient",
        phoneNumber: "",
        email: "",
        avatar: null,
      };

      booking.schedule.forEach((slot) => {
        flatItems.push({
          id: slot._id || `${booking._id}-${slot.date}-${slot.startTime}`,
          bookingId: booking._id,
          family: {
            name: family.name,
            phoneNumber: family.phoneNumber || "",
            email: family.email || "",
            avatar: family.avatar || null,
          },
          date: new Date(slot.date),
          startTime: slot.startTime,
          endTime: slot.endTime,
          tasks: slot.tasksList || [],
          status: booking.status,
          durationMin: calculateDuration(slot.startTime, slot.endTime),
        });
      });
    });

    // Sort chronologically by date and then by start time
    flatItems.sort((a, b) => {
      const dateDiff = a.date.getTime() - b.date.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.startTime.localeCompare(b.startTime);
    });

    return flatItems;
  };

  const flatSchedule = flattenSchedule(schedule);

  // Group into today and tomorrow
  const todayObj = new Date();
  const tomorrowObj = new Date();
  tomorrowObj.setDate(todayObj.getDate() + 1);

  const todayStr = getLocalDateString(todayObj);
  const tomorrowStr = getLocalDateString(tomorrowObj);

  const todayVisits = flatSchedule.filter((item) => getLocalDateString(item.date) === todayStr);
  const tomorrowVisits = flatSchedule.filter((item) => getLocalDateString(item.date) === tomorrowStr);

  const nextVisitAfterTomorrow = flatSchedule.find((item) => getLocalDateString(item.date) > tomorrowStr);

  return (
    <div className="bg-white p-6 rounded-2xl border border-stitch-outline/10 shadow-soft space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-xl font-bold text-stitch-on-surface">
          Schedule Overview (Next 48 Hours)
        </h2>
        
        {/* Toggle links (Pure Server Component View Toggle) */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit shrink-0 text-xs font-semibold">
          <Link
            href="/companion/dashboard?view=list"
            className={`px-4 py-2 rounded-lg transition-colors font-bold ${
              viewMode === "list"
                ? "bg-white text-stitch-on-surface shadow-sm"
                : "text-stitch-on-surface-variant/60 hover:text-stitch-on-surface"
            }`}
          >
            List View
          </Link>
          <Link
            href="/companion/dashboard?view=timeline"
            className={`px-4 py-2 rounded-lg transition-colors font-bold ${
              viewMode === "timeline"
                ? "bg-white text-stitch-on-surface shadow-sm"
                : "text-stitch-on-surface-variant/60 hover:text-stitch-on-surface"
            }`}
          >
            Timeline
          </Link>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-8">
        
        {/* Today Block */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
            Today, {todayObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h3>
          
          {todayVisits.length === 0 ? (
            <div className="flex items-center justify-center p-6 border border-dashed border-stitch-outline/30 rounded-2xl bg-gray-50/40 text-sm text-stitch-on-surface-variant/60 font-medium">
              No bookings scheduled for today
            </div>
          ) : (
            <div className="space-y-4">
              {todayVisits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stitch-outline/15 rounded-2xl hover:bg-stitch-secondary-container/5 transition-colors gap-4"
                >
                  <div className="flex items-center gap-6">
                    {/* Time indicator */}
                    <div className="flex items-center gap-3 min-w-[80px]">
                      <div className="w-1.5 h-10 bg-stitch-primary rounded-full shrink-0"></div>
                      <div>
                        <p className="text-base font-bold text-stitch-on-surface">{item.startTime}</p>
                        <p className="text-[11px] text-stitch-on-surface-variant/50 font-medium">
                          {item.durationMin} min
                        </p>
                      </div>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      {item.family.avatar ? (
                        <img 
                          src={item.family.avatar} 
                          alt={item.family.name}
                          className="w-10 h-10 rounded-full object-cover border border-stitch-outline/10 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getBgColorForName(item.family.name)}`}>
                          {getInitials(item.family.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-stitch-on-surface">{item.family.name}</p>
                        {item.family.phoneNumber && (
                          <p className="text-xs text-stitch-on-surface-variant/60 flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-sm">phone</span>
                            {item.family.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getBadgeStyles(item.tasks[0]?.taskDescription || "General Care")}`}>
                      {item.tasks[0]?.taskDescription || "General Care"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tomorrow Block */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stitch-on-surface-variant/50">
            Tomorrow, {tomorrowObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h3>
          
          {tomorrowVisits.length === 0 ? (
            <div className="flex items-center justify-center p-6 border border-dashed border-stitch-outline/30 rounded-2xl bg-gray-50/40 text-sm text-stitch-on-surface-variant/60 font-medium">
              {nextVisitAfterTomorrow ? (
                <span>
                  No bookings until {nextVisitAfterTomorrow.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {nextVisitAfterTomorrow.startTime}
                </span>
              ) : (
                <span>No bookings scheduled</span>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tomorrowVisits.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-stitch-outline/15 rounded-2xl hover:bg-stitch-secondary-container/5 transition-colors gap-4"
                >
                  <div className="flex items-center gap-6">
                    {/* Time indicator */}
                    <div className="flex items-center gap-3 min-w-[80px]">
                      <div className="w-1.5 h-10 bg-stitch-primary rounded-full shrink-0"></div>
                      <div>
                        <p className="text-base font-bold text-stitch-on-surface">{item.startTime}</p>
                        <p className="text-[11px] text-stitch-on-surface-variant/50 font-medium">
                          {item.durationMin} min
                        </p>
                      </div>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                      {item.family.avatar ? (
                        <img 
                          src={item.family.avatar} 
                          alt={item.family.name}
                          className="w-10 h-10 rounded-full object-cover border border-stitch-outline/10 shrink-0"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getBgColorForName(item.family.name)}`}>
                          {getInitials(item.family.name)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-stitch-on-surface">{item.family.name}</p>
                        {item.family.phoneNumber && (
                          <p className="text-xs text-stitch-on-surface-variant/60 flex items-center gap-0.5 mt-0.5">
                            <span className="material-symbols-outlined text-sm">phone</span>
                            {item.family.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:self-center">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getBadgeStyles(item.tasks[0]?.taskDescription || "General Care")}`}>
                      {item.tasks[0]?.taskDescription || "General Care"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
