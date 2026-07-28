"use server";

import { createClient } from "@/utils/supabase/server";
import { CurrentUser } from "./authentication";
import { db } from "../../db";
import { files } from "../../db/schema";
import { eq } from "drizzle-orm";

export const uploadFile = async (
  currentUser: CurrentUser,
  file: File,
  storagePath: string
) => {
  if (!currentUser.organisation?.id) {
    throw new Error("Organisation ID is required");
  }

  const [fileRecord] = await db
    .insert(files)
    .values({
      id: crypto.randomUUID(),
      organisationId: currentUser.organisation.id,
      fileName: file.name,
      mimeType: file.type,
      storagePath: null,
    })
    .returning();

  const supabase = createClient();
  const fileExtension = file.name.split(".").pop();
  const fileName = `${fileRecord.id}.${fileExtension}`;
  const fullPath = `${storagePath}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(fullPath, file);

  if (error) {
    await db.delete(files).where(eq(files.id, fileRecord.id));
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  await db
    .update(files)
    .set({ storagePath: data.path })
    .where(eq(files.id, fileRecord.id));

  return fileRecord;
};

export const downloadFile = async (
  currentUser: CurrentUser | null,
  storagePath: string,
  fileId: string
): Promise<Blob | null> => {
  if (!currentUser?.organisation?.id) {
    throw new Error("Organisation ID is required");
  }

  const [fileRecord] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId));

  if (!fileRecord) {
    throw new Error("File not found");
  }

  if (fileRecord.organisationId !== currentUser.organisation.id) {
    throw new Error("Access denied");
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("uploads")
    .download(fileRecord.storagePath || `${storagePath}/${fileRecord.id}`);

  if (error) {
    console.error("Download error:", error);
    return null;
  }

  return data;
};

export const uploadProfilePicture = async (
  currentUser: CurrentUser,
  file: File
) => {
  return uploadFile(currentUser, file, "profile-pictures");
};

export const downloadProfilePicture = async (
  currentUser: CurrentUser | null,
  fileId: string
): Promise<Blob | null> => {
  if (!currentUser?.organisation?.id) {
    return null;
  }

  return downloadFile(currentUser, "profile-pictures", fileId);
};
