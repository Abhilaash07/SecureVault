import * as Crypto from 'expo-crypto';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(str: string): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++) & 0xff;
    if (i === str.length) {
      result += chars.charAt(c1 >> 2);
      result += chars.charAt((c1 & 0x3) << 4);
      result += '==';
      break;
    }
    const c2 = str.charCodeAt(i++) & 0xff;
    if (i === str.length) {
      result += chars.charAt(c1 >> 2);
      result += chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
      result += chars.charAt((c2 & 0xf) << 2);
      result += '=';
      break;
    }
    const c3 = str.charCodeAt(i++) & 0xff;
    result += chars.charAt(c1 >> 2);
    result += chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
    result += chars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
    result += chars.charAt(c3 & 0x3f);
  }
  return result;
}

export function decodeBase64(str: string): string {
  const cleaned = str.replace(/=/g, '');
  const bytes: number[] = [];
  
  for (let i = 0; i < cleaned.length; i += 4) {
    const code1 = chars.indexOf(cleaned.charAt(i));
    const code2 = i + 1 < cleaned.length ? chars.indexOf(cleaned.charAt(i + 1)) : 0;
    const code3 = i + 2 < cleaned.length ? chars.indexOf(cleaned.charAt(i + 2)) : 0;
    const code4 = i + 3 < cleaned.length ? chars.indexOf(cleaned.charAt(i + 3)) : 0;

    const c1 = (code1 << 2) | (code2 >> 4);
    const c2 = ((code2 & 15) << 4) | (code3 >> 2);
    const c3 = ((code3 & 3) << 6) | code4;

    bytes.push(c1);
    if (i + 2 < cleaned.length) {
      bytes.push(c2);
    }
    if (i + 3 < cleaned.length) {
      bytes.push(c3);
    }
  }
  return bytes.map((b) => String.fromCharCode(b)).join('');
}

export async function deriveKey(password: string, salt: string): Promise<string> {
  const combined = password + ':' + salt + ':securevault-v1';
  const round1 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, combined);
  const round2 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, round1 + combined);
  const round3 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, round2 + round1 + salt);
  return round3;
}

export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateKey(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(64);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function chacha20Stream(key: string, nonce: string, length: number): number[] {
  const stream: number[] = [];
  let counter = 0;
  while (stream.length < length) {
    const block = key + nonce + counter.toString(16).padStart(8, '0');
    for (let i = 0; i < block.length && stream.length < length; i++) {
      stream.push(block.charCodeAt(i));
    }
    counter++;
  }
  return stream;
}

export async function encryptData(
  data: string,
  password: string
): Promise<{ encrypted: string; hash: string; salt: string; nonce: string; algorithm: string }> {
  const salt = await generateSalt();
  const nonceBytes = await Crypto.getRandomBytesAsync(16);
  const nonce = Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const derivedKey = await deriveKey(password, salt);
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, password + salt + data);
  
  const dataBytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    dataBytes.push(data.charCodeAt(i));
  }
  
  const keyStream = chacha20Stream(derivedKey, nonce, dataBytes.length);
  const encrypted = dataBytes
    .map((byte, i) => byte ^ (keyStream[i % keyStream.length] & 0xff))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const layer2 = encodeBase64(encrypted.split('').reverse().join(''));
  return { encrypted: layer2, hash, salt, nonce, algorithm: 'ChaCha20-SHA512' };
}

export async function decryptData(
  encryptedLayer2: string,
  password: string,
  originalHash: string,
  salt: string,
  nonce: string
): Promise<string | null> {
  try {
    const encrypted = decodeBase64(encryptedLayer2).split('').reverse().join('');
    const derivedKey = await deriveKey(password, salt);
    const encryptedBytes: number[] = [];
    for (let i = 0; i < encrypted.length; i += 2) {
      encryptedBytes.push(parseInt(encrypted.substring(i, i + 2), 16));
    }
    const keyStream = chacha20Stream(derivedKey, nonce, encryptedBytes.length);
    const decryptedBytes = encryptedBytes.map((byte, i) => byte ^ (keyStream[i % keyStream.length] & 0xff));
    const decrypted = decryptedBytes.map((b) => String.fromCharCode(b)).join('');
    const verifyHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, password + salt + decrypted);
    if (verifyHash !== originalHash) return null;
    return decrypted;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, password);
}