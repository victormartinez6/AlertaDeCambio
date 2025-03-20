import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export interface FileUploadProgress {
  progress: number;
  downloadURL?: string;
  path?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
}

export const uploadFile = async (
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<FileAttachment> => {
  const storage = getStorage();
  const fileId = uuidv4();
  const fileExt = file.name.split('.').pop();
  const fileName = `${fileId}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  const fileRef = storageRef(storage, filePath);

  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Erro no upload:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(fileRef);
          const attachment: FileAttachment = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: downloadURL,
            path: filePath,
            uploadedAt: new Date()
          };
          resolve(attachment);
        } catch (error) {
          console.error('Erro ao obter URL de download:', error);
          reject(error);
        }
      }
    );
  });
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const storage = getStorage();
  const fileRef = storageRef(storage, filePath);
  
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    throw error;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
