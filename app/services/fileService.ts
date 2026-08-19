import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useSessionStore } from './sessionStore';
import { Platform } from 'react-native';
import { showAlert } from './alert';

export function getUserDirectory(): string {
  if (Platform.OS === 'web') {
    return '';
  }
  const user = useSessionStore.getState().user;
  const uid = user?.uid || 'anonymous';
  return `${FileSystem.documentDirectory}${uid}/`;
}

export async function ensureUserDirectory(dir: string): Promise<void> {
  if (Platform.OS === 'web' || !dir) return;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export function getFilePath(fileName: string): string {
  if (Platform.OS === 'web') {
    return fileName;
  }
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
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  return await FileSystem.readAsStringAsync(uri, {
    encoding:'base64',
  });
}

export async function readFileAsText(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.text();
  }
  return await FileSystem.readAsStringAsync(uri, {
    encoding: 'utf8',
  });
}

export async function saveEncryptedFile(
  encryptedData: string,
  fileName: string
): Promise<string> {
  const cleanBaseName = fileName.endsWith('.enc') ? fileName.slice(0, -4) : fileName;
  const encFileName = cleanBaseName + '.enc';

  if (Platform.OS === 'web') {
    // Trigger browser download of the .enc file directly
    const blob = new Blob([encryptedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = encFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // Track filename only (not content) in localStorage for Vault listing
    const uid = useSessionStore.getState().user?.uid || 'anonymous';
    const storageKey = `securevault_files_${uid}`;
    const filesJson = localStorage.getItem(storageKey) || '[]';
    let files: string[] = [];
    try {
      files = JSON.parse(filesJson);
      if (!Array.isArray(files)) files = [];
    } catch {
      files = [];
    }
    if (!files.includes(encFileName)) {
      files.push(encFileName);
      localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(files))));
    }

    return encFileName;
  }
  const dir = getUserDirectory();
  await ensureUserDirectory(dir);
  const path = dir + encFileName;
  await FileSystem.writeAsStringAsync(path, encryptedData, {
    encoding: 'utf8',
  });
  return path;
}

export async function saveDecryptedFile(
  data: string,
  fileName: string
): Promise<string> {
  if (Platform.OS === 'web') {
    // Decode base64, create blob, trigger browser download
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return url;
  }
  const dir = getUserDirectory() + 'decrypted/';
  await ensureUserDirectory(dir);
  const path = dir + fileName;
  await FileSystem.writeAsStringAsync(path, data, {
    encoding: 'base64',
  });
  return path;
}

export async function shareFile(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    // If it's already a blob/data URL, just download it directly
    if (uri.startsWith('blob:') || uri.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = uri;
      a.download = 'decrypted_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const fileName = uri.includes('/') ? uri.substring(uri.lastIndexOf('/') + 1) : uri;
    showAlert('Encrypted File', `The encrypted file "${fileName}" was downloaded to your Downloads folder when it was encrypted.`);
    return;
  }
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri);
  }
}

export async function deleteFile(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    const fileName = uri.includes('/') ? uri.substring(uri.lastIndexOf('/') + 1) : uri;
    const cleanBaseName = fileName.endsWith('.enc') ? fileName.slice(0, -4) : fileName;
    const encFileName = cleanBaseName + '.enc';
    const uid = useSessionStore.getState().user?.uid || 'anonymous';
    const storageKey = `securevault_files_${uid}`;
    const filesJson = localStorage.getItem(storageKey) || '[]';
    let files: string[] = [];
    try {
      files = JSON.parse(filesJson);
      if (!Array.isArray(files)) files = [];
    } catch {
      files = [];
    }
    files = files.filter((f) => f !== fileName && f !== encFileName && f !== cleanBaseName && f !== uri);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(files))));
    localStorage.removeItem(`securevault_content_${uid}_${fileName}`);
    localStorage.removeItem(`securevault_content_${uid}_${encFileName}`);
    localStorage.removeItem(`securevault_content_${uid}_${uri}`);
    return;
  }
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function listEncryptedFiles(): Promise<string[]> {
  if (Platform.OS === 'web') {
    const uid = useSessionStore.getState().user?.uid || 'anonymous';
    const storageKey = `securevault_files_${uid}`;
    const filesJson = localStorage.getItem(storageKey) || '[]';
    try {
      const parsed = JSON.parse(filesJson);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.filter((f) => typeof f === 'string' && f.trim() !== '')));
      }
      return [];
    } catch {
      return [];
    }
  }
  const dir = getUserDirectory();
  await ensureUserDirectory(dir);
  try {
    const files = await FileSystem.readDirectoryAsync(dir);
    const encFiles = files.filter((f) => f.endsWith('.enc'));
    return Array.from(new Set(encFiles));
  } catch (e) {
    console.error('Error reading encrypted files:', e);
    return [];
  }
}

export async function wipeAllData(): Promise<void> {
  if (Platform.OS === 'web') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('securevault_') || key.startsWith('decrypt_count_') || key === 'decrypt_count' || key === 'user_display_name')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    return;
  }
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