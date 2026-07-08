export interface CompanionProfileCompletionInput {
  bio?: string | null;
  hobbies?: unknown[] | null;
  skills?: unknown[] | null;
  availability?: Array<{ day?: string; slots?: unknown[] }> | null;
  documents?: {
    nationalIdCard?: { url?: string | null; public_id?: string | null } | null;
    criminalRecord?: { url?: string | null; public_id?: string | null } | null;
  } | null;
}

export interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  message: string;
}

const hasUploadedDocument = (document?: { url?: string | null; public_id?: string | null } | null) => {
  if (!document) return false;
  if (document.public_id) return true;
  return Boolean(document.url && !document.url.includes("placeholder"));
};

export function calculateCompanionProfileCompletion(
  profile?: CompanionProfileCompletionInput | null,
): ProfileCompletionResult {
  const checks = [
    { key: "bio", weight: 20, complete: Boolean(profile?.bio?.trim()) },
    { key: "hobbies", weight: 10, complete: Boolean(profile?.hobbies?.length) },
    { key: "skills", weight: 20, complete: Boolean(profile?.skills?.length) },
    {
      key: "availability",
      weight: 20,
      complete: Boolean(profile?.availability?.some((item) => item.slots && item.slots.length > 0)),
    },
    {
      key: "nationalIdCard",
      weight: 15,
      complete: hasUploadedDocument(profile?.documents?.nationalIdCard),
    },
    {
      key: "criminalRecord",
      weight: 15,
      complete: hasUploadedDocument(profile?.documents?.criminalRecord),
    },
  ];

  const percentage = checks.reduce((total, check) => total + (check.complete ? check.weight : 0), 0);
  const missingFields = checks.filter((check) => !check.complete).map((check) => check.key);

  return {
    percentage: Math.min(percentage, 100),
    missingFields,
    message:
      missingFields.length === 0
        ? "Your profile is complete."
        : "Complete your profile to increase visibility to families.",
  };
}
