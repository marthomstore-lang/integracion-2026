import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// This ID is the one you provided: 16IkoeV3gGppZjn15DRNxA4mRDcsaqTfi
const PARENT_FOLDER_ID = '16IkoeV3gGppZjn15DRNxA4mRDcsaqTfi';

// Path to your service account key
const KEY_FILE_PATH = path.join(process.cwd(), 'service-account.json');

export async function getDriveClient() {
  if (!fs.existsSync(KEY_FILE_PATH)) {
    console.warn('⚠️ Archivo service-account.json no encontrado. Usando almacenamiento LOCAL.');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function createFolder(folderName: string, parentId: string = PARENT_FOLDER_ID) {
  const drive = await getDriveClient();
  if (!drive) return null;

  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    console.error('Error creating folder in Drive:', error);
    return null;
  }
}

export async function uploadFileToDrive(fileName: string, mimeType: string, body: any, parentId: string = PARENT_FOLDER_ID) {
  const drive = await getDriveClient();
  if (!drive) return null;

  try {
    const fileMetadata = {
      name: fileName,
      parents: [parentId],
    };

    const media = {
      mimeType: mimeType,
      body: body,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    return file.data.id;
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return null;
  }
}
