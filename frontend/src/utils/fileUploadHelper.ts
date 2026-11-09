export interface UploadedFileResult {
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
}

export const readFileAsDataURL = (file: File): Promise<UploadedFileResult> => {
  return new Promise((resolve, reject) => {
    // 10 MB maximum size
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      reject(new Error(`File "${file.name}" exceeds maximum allowed size of 10 MB.`));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read file "${file.name}".`));
    };
    reader.readAsDataURL(file);
  });
};

