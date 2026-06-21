import { api } from "@/lib/services/api";

/**
 * Upload User Avatar
 * @param {File} file - The image file to upload
 * @returns {Promise<any>}
 */
export const uploadUserAvatar = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

/**
 * Upload Companion Documents
 * @param {Object} documents - Object containing document files
 * @param {File} documents.nationalIdCard - Required National ID Card file
 * @param {File} documents.criminalRecord - Required Criminal Record file
 * @param {File} [documents.syndicateCard] - Optional Syndicate Card file
 * @param {File[]} [documents.medicalCertificates] - Optional array of Medical Certificate files
 * @returns {Promise<any>}
 */
export const uploadCompanionDocuments = async (documents: {
  nationalIdCard: File;
  criminalRecord: File;
  syndicateCard?: File;
  medicalCertificates?: File[];
}) => {
  try {
    const formData = new FormData();

    formData.append("nationalIdCard", documents.nationalIdCard);
    formData.append("criminalRecord", documents.criminalRecord);

    if (documents.syndicateCard) {
      formData.append("syndicateCard", documents.syndicateCard);
    }

    if (documents.medicalCertificates && documents.medicalCertificates.length > 0) {
      documents.medicalCertificates.forEach((file) => {
        formData.append("medicalCertificates", file);
      });
    }

    const response = await api.post("/upload/companion/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading companion documents:", error);
    throw error;
  }
};

/**
 * Upload Public File (e.g. for registration)
 * @param {File} file - The file to upload
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export const uploadPublicFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload/public", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.file;
  } catch (error) {
    console.error("Error uploading public file:", error);
    throw error;
  }
};
