const MAX_UPLOAD_REQUEST_BYTES = 10 * 1024 * 1024;

export async function buildUploadRequestBody(folderId: string, files: File[]) {
  const images = await Promise.all(files.map((file) => buildUploadPayload(file)));
  return buildUploadRequest(folderId, images);
}

export async function buildSingleUploadRequestBody(folderId: string, file: File) {
  const image = await buildUploadPayload(file);
  return buildUploadRequest(folderId, [image]);
}

function buildUploadRequest(folderId: string, images: Awaited<ReturnType<typeof buildUploadPayload>>[]) {
  const requestBody = JSON.stringify({ folderId, images });
  const requestBytes = new Blob([requestBody]).size;

  return {
    requestBody,
    requestBytes,
  };
}

export function exceedsUploadLimit(bytes: number) {
  return bytes > MAX_UPLOAD_REQUEST_BYTES;
}

export function getUploadLimitBytes() {
  return MAX_UPLOAD_REQUEST_BYTES;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const [, base64] = result.split(",");
        resolve(base64 ?? "");
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function buildUploadPayload(file: File) {
  const image = await toBase64(file);
  const thumbnail = await createThumbnailFile(file);

  return {
    imageName: file.name,
    image,
    thumbnailImage: await toBase64(thumbnail),
    thumbnailContentType: thumbnail.type || file.type || "image/jpeg",
  };
}

async function createThumbnailFile(file: File) {
  if (file.type === "image/gif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxWidth = 960;
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not create canvas context for thumbnail.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (value) {
          resolve(value);
          return;
        }
        reject(new Error("Failed to render thumbnail."));
      },
      outputType,
      outputType === "image/jpeg" ? 0.82 : undefined,
    );
  });

  return new File([blob], file.name, {
    type: outputType,
    lastModified: file.lastModified,
  });
}
