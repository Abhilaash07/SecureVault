import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useSessionStore } from './sessionStore';

export function getUserDirectory(): string {
  const user = useSessionStore.getState().user;
  const uid = user?.uid || 'anonymous';
  return `${FileSystem.documentDirectory}${uid}/`;
}

export async function ensureUserDirectory(dir: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export function getFilePath(fileName: string): string {
  return getUserDirectory() + fileName;
}

export async function pickFile() {
  try {
    const result: any = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    
    if (!result) return null;

    // Support both old and new cancellation flags
    if (result.canceled === true || result.type === 'cancel') {
      return null;
    }
    
    // Support modern format (Expo SDK 50+)
    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }
    
    // Support legacy format (Expo SDK 49 and below)
    if (result.uri) {
      return {
        uri: result.uri,
        name: result.name || 'unnamed_file',
        size: result.size || 0,
        mimeType: result.mimeType || '*/*',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in pickFile:', error);
    throw error;
  }
}

export async function readFileAsBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding:'base64',
  });
}

export async function saveEncryptedFile(
  encryptedData: string,
  fileName: string
): Promise<string> {
  const dir = getUserDirectory();
  await ensureUserDirectory(dir);
  const path = dir + fileName + '.enc';
  await FileSystem.writeAsStringAsync(path, encryptedData, {
    encoding: 'utf8',
  });
  return path;
}

export async function saveDecryptedFile(
  data: string,
  fileName: string
): Promise<string> {
  const dir = getUserDirectory();
  await ensureUserDirectory(dir);
  const path = dir + fileName;
  await FileSystem.writeAsStringAsync(path, data, {
    encoding: 'base64',
  });
  return path;
}

export async function shareFile(uri: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri);
  }
}

export async function deleteFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function listEncryptedFiles(): Promise<string[]> {
  const dir = getUserDirectory();
  await ensureUserDirectory(dir);
  const files = await FileSystem.readDirectoryAsync(dir);
  return files.filter((f) => f.endsWith('.enc'));
}

export async function wipeAllData(): Promise<void> {
  const dir = FileSystem.documentDirectory;
  if (!dir) return;
  try {
    const items = await FileSystem.readDirectoryAsync(dir);
    for (const item of items) {
      await FileSystem.deleteAsync(dir + item, { idempotent: true });
    }
  } catch (e) {
    console.error('Error wiping all data:', e);
  }
}