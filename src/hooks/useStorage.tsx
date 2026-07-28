import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

interface UploadFileProps {
  file: File;
  storagePath: string;
}

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({ file, storagePath }: UploadFileProps) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storagePath", storagePath);

      const response = await axios.post<UploadFileResponse>(
        "/api/storage/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to upload file");
      }

      return response.data.data;
    },
  });
}

export function useDownloadFile(fileId: string | null, storagePath: string) {
  return useQuery({
    queryKey: ["file", fileId],
    queryFn: async () => {
      if (!fileId) {
        return null;
      }

      const response = await axios.get("/api/storage/download", {
        params: { fileId, storagePath },
        responseType: "blob",
      });

      return response.data;
    },
    enabled: !!fileId,
  });
}

export function useUploadProfilePicture() {
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<UploadProfilePictureResponse>(
        "/api/storage/profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error || "Failed to upload profile picture"
        );
      }

      return response.data.data;
    },
  });
}

export function useDownloadProfilePicture(fileId: string | null) {
  return useQuery({
    queryKey: ["profilePicture", fileId],
    queryFn: async () => {
      if (!fileId) {
        return null;
      }

      const response = await axios.get("/api/storage/profile-picture", {
        params: { fileId },
        responseType: "blob",
      });

      return response.data;
    },
    enabled: !!fileId,
  });
}
