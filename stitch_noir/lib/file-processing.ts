import * as FileSystem from 'expo-file-system';

export const SUPPORTED_UPLOAD_EXTENSIONS = ['txt', 'md', 'pdf', 'docx', 'png', 'jpg', 'jpeg'] as const;
export type SupportedUploadExtension = (typeof SUPPORTED_UPLOAD_EXTENSIONS)[number];

export type UploadSource = {
  uri?: string | null;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
  file?: File | null;
};

export type UploadContentKind = 'text' | 'document' | 'image' | 'unknown';

export function getFileExtension(filename?: string | null) {
  if (!filename) {
    return '';
  }

  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export function isSupportedUpload(filename?: string | null, mimeType?: string | null) {
  const extension = getFileExtension(filename);
  if (SUPPORTED_UPLOAD_EXTENSIONS.includes(extension as SupportedUploadExtension)) {
    return true;
  }

  if (mimeType?.startsWith('image/')) {
    return true;
  }

  return false;
}

export function getUploadContentKind(filename?: string | null, mimeType?: string | null): UploadContentKind {
  const extension = getFileExtension(filename);

  if (extension === 'txt' || extension === 'md' || mimeType?.startsWith('text/')) {
    return 'text';
  }

  if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg'].includes(extension)) {
    return 'image';
  }

  if (['pdf', 'docx'].includes(extension)) {
    return 'document';
  }

  return 'unknown';
}

export async function uploadSourceToText(source: UploadSource) {
  if (source.file) {
    return source.file.text();
  }

  if (!source.uri) {
    throw new Error('Upload source is missing a URI');
  }

  const kind = getUploadContentKind(source.name, source.mimeType);
  if (kind === 'text') {
    return FileSystem.readAsStringAsync(source.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  }

  throw new Error('This file type requires server-side extraction');
}

export async function uploadSourceToBase64(source: UploadSource) {
  if (source.file) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to convert file to base64'));
          return;
        }

        const base64 = result.split(',')[1];
        resolve(base64 ?? result);
      };
      reader.readAsDataURL(source.file as File);
    });
  }

  if (!source.uri) {
    throw new Error('Upload source is missing a URI');
  }

  return FileSystem.readAsStringAsync(source.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export function buildUploadPath(userId: string, chatId: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${userId}/${chatId}/${Date.now()}-${safeName}`;
}

export function inferMimeType(filename?: string | null) {
  const extension = getFileExtension(filename);

  switch (extension) {
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'pdf':
      return 'application/pdf';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}
