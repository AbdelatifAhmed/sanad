export type ScheduleRole = "family" | "companion";

export interface Counterparty {
  _id: string;
  name: string;
  avatar?: any;
  phone?: string;
}

export interface ScheduleItem {
  bookingId: string;
  bookingStatus: string;
  counterparty: Counterparty;
  location: any;
  date: string;
  startTime: string;
  endTime: string;
  checkInTime?: string;
  checkOutTime?: string;
  tasksList: any[];
  slotIndex: number;
}

export function getDetailLink(role: ScheduleRole, bookingId: string): string {
  if (role === "family") {
    return `/family/bookings/${bookingId}?from=schedule`;
  }
  return `/companion/shift/${bookingId}`;
}
