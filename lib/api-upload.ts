import { api } from "./api";
import type { UploadResponse } from "./types";

// ─── Upload API ───────────────────────────────────────────────────────────────
//
// All endpoints accept multipart/form-data.
// The field name used in the FormData matters – the backend inspects it to
// decide which S3 folder to store the file in.
//
// Backend routes:
//   POST /upload                    → generic (field name drives the folder)
//   POST /upload/profile            → profile picture
//   POST /upload/cover              → cover photo
//   POST /upload/post               → post media (images / videos)
//   POST /upload/story              → story media
//   POST /upload/message            → message attachment
// ---------------------------------------------------------------------------

function buildFormData(
  fieldName: string,
  file: File | Blob,
  filename?: string,
): FormData {
  const form = new FormData();
  form.append(
    fieldName,
    file,
    filename ?? (file instanceof File ? file.name : "file"),
  );
  return form;
}

// Axios doesn't need an explicit Content-Type header for multipart –
// it sets it automatically with the correct boundary when given a FormData body.
const multipartConfig = {
  headers: { "Content-Type": "multipart/form-data" },
};

export const uploadApi = {
  /**
   * POST /upload
   * Generic upload endpoint. The `fieldName` you pass determines the storage
   * folder on the backend (e.g. "profile_picture", "story", "message_attachment").
   * Returns an array because the generic handler supports multiple files.
   */
  upload: (
    files: File | File[],
    fieldName = "file",
  ): Promise<UploadResponse[]> => {
    const form = new FormData();
    const arr = Array.isArray(files) ? files : [files];
    arr.forEach((f) => form.append(fieldName, f, f.name));
    return api
      .post<UploadResponse[]>("/upload", form, multipartConfig)
      .then((r) => r.data);
  },

  /**
   * POST /upload/profile
   * Uploads a profile picture. Returns a single UploadResponse with the CDN URL.
   */
  uploadProfilePicture: (file: File): Promise<UploadResponse> => {
    const form = buildFormData("profile_picture", file);
    return api
      .post<UploadResponse>("/upload/profile", form, multipartConfig)
      .then((r) => r.data);
  },

  /**
   * POST /upload/cover
   * Uploads a cover / banner photo.
   */
  uploadCoverPhoto: (file: File): Promise<UploadResponse> => {
    const form = buildFormData("cover_photo", file);
    return api
      .post<UploadResponse>("/upload/cover", form, multipartConfig)
      .then((r) => r.data);
  },

  /**
   * POST /upload/post
   * Uploads one or more images / videos for a post.
   * Multiple files can be appended under the same field name.
   */
  uploadPostMedia: (files: File | File[]): Promise<UploadResponse[]> => {
    const form = new FormData();
    const arr = Array.isArray(files) ? files : [files];
    arr.forEach((f) => form.append("post_media", f, f.name));
    return api
      .post<UploadResponse[]>("/upload/post", form, multipartConfig)
      .then((r) => r.data);
  },

  /**
   * POST /upload/story
   * Uploads a single image or short video for a story.
   */
  uploadStoryMedia: (file: File): Promise<UploadResponse> => {
    const form = buildFormData("story", file);
    return api
      .post<UploadResponse>("/upload/story", form, multipartConfig)
      .then((r) => r.data);
  },

  /**
   * POST /upload/message
   * Uploads a file attachment for a chat message (image, video, audio, doc).
   */
  uploadMessageAttachment: (file: File): Promise<UploadResponse> => {
    const form = buildFormData("message_attachment", file);
    return api
      .post<UploadResponse>("/upload/message", form, multipartConfig)
      .then((r) => r.data);
  },
};

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Validates a file against the allowed MIME types and max size before
 * sending it to the upload endpoint.
 *
 * @throws Error with a user-friendly message if validation fails.
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSizeBytes?: number;
  } = {},
): void {
  const {
    allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
    ],
    maxSizeBytes = 50 * 1024 * 1024, // 50 MB default
  } = options;

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido: ${file.type}. ` +
        `Formatos aceptados: ${allowedTypes.join(", ")}`,
    );
  }

  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `El archivo (${fileMB} MB) supera el tamaño máximo permitido de ${maxMB} MB.`,
    );
  }
}

/**
 * Reads a File as a data-URL and returns a local preview string.
 * Useful for showing an image preview before it's uploaded.
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
