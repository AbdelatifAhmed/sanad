export type ObjectIdString = string;

export type UserRole = "family" | "companion" | "admin";
export type PaymentMethod = "cash" | "card" | "wallet";
export type BookingStatus =
  | "pending"
  | "pending_payment"
  | "approved"
  | "active"
  | "completed"
  | "cancelled";
export type BookingPaymentStatus = "unpaid" | "paid" | "refunded";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed" | "abandoned";
export type RefundStatus = "none" | "pending" | "completed" | "failed";
export type ProposalStatus = "pending" | "accepted" | "rejected";
export type JobPostStatus = "open" | "filled" | "closed";
export type ServiceType =
  | "elderly_care"
  | "child_care"
  | "home_nursing"
  | "physical_therapy"
  | "companionship";
export type NotificationType =
  | "booking"
  | "tracking"
  | "review"
  | "payment"
  | "system_alert"
  | "chat"
  | "admin"
  | string;
export type Weekday =
  | "Saturday"
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export interface LocationGeo {
  type: "Point";
  coordinates: [number, number];
}

export interface LocationDetails {
  geo: LocationGeo;
  readableAddress?: string | null;
  city: string;
  governorate: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string | null;
  location: LocationDetails | null;
  companionId?: string | null;
  verificationStatus?: "pending" | "verified" | "rejected";
  familyId?: string | null;
}

export interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: UserData, accessToken: string) => void;
  clearAuth: () => void;
  updateAvatar: (avatarUrl: string) => void;
}

export interface ScheduleTaskEntry {
  _id?: string;
  title?: string;
  taskDescription: string;
  isCompleted: boolean;
}

export interface BookingScheduleEntry {
  _id?: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  tasksList: ScheduleTaskEntry[];
  checkInTime?: string | Date | null;
  checkOutTime?: string | Date | null;
  checkInMethod?: string | null;
}

export interface Booking {
  _id: string;
  familyId: UserData | string;
  companionId: UserData | string;
  jobPostId?: string;
  beneficiaryId?: string;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  paymentMethod: PaymentMethod;
  adminFee?: number;
  companionEarnings?: number;
  hourlyRateAtBooking?: number;
  totalHours?: number;
  totalPrice?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  workingDays?: Weekday[];
  schedule?: BookingScheduleEntry[];
  notes?: string;
  location?: LocationDetails;
  beneficiary?: {
    name: string;
    age: number;
    gender: string;
    category: string;
    conditionDetails: string;
  };
}

export interface CompanionProfile {
  _id: string;
  userId: UserData | string;
  companionType: "general" | "specialized";
  specialization: "none" | "nursing" | "physiotherapy" | "companionship_companion";
  bio: string;
  hourlyRate: number;
  skills: string[];
  hobbies: string[];
  verificationStatus: "pending" | "verified" | "rejected";
  rating?: number;
  reviewCount?: number;
}

export interface JobPostSchedule {
  workingDays: Weekday[];
  startTime: string;
  endTime: string;
  durationInWeeks: number;
}

export interface JobPost {
  _id: string;
  familyId: UserData | string;
  beneficiaryId: string;
  title: string;
  description: string;
  serviceType: ServiceType;
  requiredSkills: string[];
  taskList?: string[];
  preferredGender?: "any gender" | "male" | "female";
  budgetPerHour: number;
  preferredCaregiverGender?: "male" | "female";
  schedule: JobPostSchedule;
  location: LocationDetails;
  status: JobPostStatus;
  startDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Proposal {
  _id: string;
  jobPostId: string;
  companionId: UserData | string;
  proposedRate: number;
  coverLetter: string;
  status: ProposalStatus;
  taskList?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface NotificationItem {
  _id: string;
  recipientId: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string | null;
  relatedModel?: "Booking" | "Review" | null;
  isRead: boolean;
  readAt?: string | Date | null;
  createdAt?: string | Date;
}

export interface PaymentRecord {
  _id: string;
  bookingId: string;
  familyId: UserData | string;
  companionId: UserData | string;
  amount: number;
  adminFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  payoutReleased?: boolean;
  payoutTransactionId?: string;
  payoutDate?: string | Date;
  refundStatus?: RefundStatus;
  refundTransactionId?: string;
  refundDate?: string | Date;
  refundReason?: string;
}

export interface ApiPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  status: "success" | "fail" | "error";
  message?: string;
  data?: T;
  results?: number;
  pagination?: ApiPagination;
}

export interface LoginResponse {
  accessToken: string;
  user: UserData;
}

export interface CreateBookingPayload {
  companionId: string;
  beneficiaryId: string;
  hourlyRateAtBooking: number;
  totalHours: number;
  startDate: string;
  endDate: string;
  workingDays: Weekday[];
  schedule: BookingScheduleEntry[];
  notes?: string;
  paymentMethod?: PaymentMethod;
}

export interface SendProposalBody {
  jobPostId: string;
  proposedRate: number;
  coverLetter: string;
}

export interface UpdateProposalStatusBody {
  status: ProposalStatus;
}

export interface PayBookingBody {
  paymentMethod: PaymentMethod;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  location?: LocationDetails;
}
