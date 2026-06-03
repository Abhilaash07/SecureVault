import * as SecureStore from 'expo-secure-store';

export interface AuditLogEntry {
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  email: string;
}

const LOG_KEY = 'access_audit_logs';

export async function logEvent(
  status: 'SUCCESS' | 'FAILED',
  details: string,
  email: string
): Promise<void> {
  try {
    const rawLogs = await SecureStore.getItemAsync(LOG_KEY);
    const logs: AuditLogEntry[] = rawLogs ? JSON.parse(rawLogs) : [];
    
    const newEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      status,
      details,
      email: email || 'unknown',
    };
    
    // Keep only the last 50 log entries to conserve space
    const updatedLogs = [newEntry, ...logs].slice(0, 50);
    await SecureStore.setItemAsync(LOG_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getLogs(): Promise<AuditLogEntry[]> {
  try {
    const rawLogs = await SecureStore.getItemAsync(LOG_KEY);
    return rawLogs ? JSON.parse(rawLogs) : [];
  } catch {
    return [];
  }
}

export async function clearLogs(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LOG_KEY);
  } catch (error) {
    console.error('Failed to clear audit logs:', error);
  }
}
