import * as SecureStore from 'expo-secure-store';

export interface KeyEntry {
  name: string;
  value: string;
  algorithm: string;
  createdAt: string;
}

export async function saveKey(keyName: string, keyValue: string, algorithm: string): Promise<void> {
  const entry: KeyEntry = {
    name: keyName,
    value: keyValue,
    algorithm,
    createdAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(keyName, JSON.stringify(entry));

  // Update key index
  const index = await getKeyIndex();
  if (!index.includes(keyName)) {
    index.push(keyName);
    await SecureStore.setItemAsync('key_index', JSON.stringify(index));
  }
}

export async function getKey(keyName: string): Promise<KeyEntry | null> {
  const raw = await SecureStore.getItemAsync(keyName);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function deleteKey(keyName: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyName);
  const index = await getKeyIndex();
  const updated = index.filter((k) => k !== keyName);
  await SecureStore.setItemAsync('key_index', JSON.stringify(updated));
}

export async function getKeyIndex(): Promise<string[]> {
  try {
    const index = await SecureStore.getItemAsync('key_index');
    return index ? JSON.parse(index) : [];
  } catch {
    return [];
  }
}

export async function getAllKeys(): Promise<KeyEntry[]> {
  const index = await getKeyIndex();
  const keys: KeyEntry[] = [];
  for (const keyName of index) {
    const entry = await getKey(keyName);
    if (entry) keys.push(entry);
  }
  return keys;
}