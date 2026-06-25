// Types for the Family Care Request wizard — mapped to backend JobPost schema

export type ServiceType =
  | "elderly_care"
  | "child_care"
  | "home_nursing"
  | "physical_therapy"
  | "companionship";

export type WorkingDay =
  | "Saturday"
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export type JobPostStatus = "open" | "filled" | "closed";

export interface Beneficiary {
  _id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  category: "elderly" | "special_needs";
  conditionDetails: string;
  interests: string[];
}

export interface FamilyProfile {
  _id: string;
  familyId: string;
  address: { city: string; area: string; fullAddress: string };
  beneficiaries: Beneficiary[];
}

export interface CareRequestFormData {
  // Step 1 – Care Details
  beneficiaryId: string;
  serviceType: ServiceType;
  description: string;
  budgetPerHour: number | "";
  taskList?: string[];
  preferredGender?: "any gender" | "male" | "female";
  requiredSkills?: string[];
  // Step 2 – Scheduling
  scheduleData: {
    workingDays: WorkingDay[];
    startTime: string;
    endTime: string;
    durationInWeeks: number | "";
  };
  // Step 3 – Location
  locationData: {
    city: string;
    governorate: string;
    readableAddress: string;
    notes: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
}

// Returned from GET /family/my-job-posts
export interface JobPost {
  _id: string;
  familyId: string;
  beneficiaryId: string;
  title: string;
  description: string;
  serviceType: ServiceType;
  requiredSkills: string[];
  taskList?: string[];
  preferredGender?: "any gender" | "male" | "female";
  budgetPerHour: number;
  schedule: {
    workingDays: WorkingDay[];
    startTime: string;
    endTime: string;
    durationInWeeks: number;
  };
  location: {
    geo?: { type: string; coordinates: number[] };
    readableAddress?: string;
    city: string;
    governorate: string;
  };
  status: JobPostStatus;
  createdAt: string;
  updatedAt: string;
}
