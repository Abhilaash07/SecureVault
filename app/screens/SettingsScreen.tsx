import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  AppState,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { auth } from '../services/firebaseConfig';
import { logOut } from '../services/auth';
import { listEncryptedFiles, deleteFile, getFilePath } from '../services/fileService';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from '../services/sessionStore';
import { getLogs, clearLogs } from '../services/auditLog';

export default function SettingsScreen() {
  const isDecoy = useSessionStore((state) => state.isDecoy);
  const user = useSessionStore((state) => state.user);
  const [fileCount, setFileCount] = useState(0);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLock, setAutoLock] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  const [decoyEnabled, setDecoyEnabled] = useState(false);
  const [decoyPassword, setDecoyPassword] = useState('');
  const [showDecoyInput, setShowDecoyInput] = useState(false);
  const [decoyInput, setDecoyInput] = useState('');
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);

  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadSettings();

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
      }

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const autoLockEnabled = await SecureStore.getItemAsync('auto_lock');
        const minutes = await SecureStore.getItemAsync('auto_lock_minutes');
        const mins = minutes ? parseInt(minutes) : 5;

        if (autoLockEnabled === 'true' && backgroundTime.current) {
          const elapsed = (Date.now() - backgroundTime.current) / 1000 / 60;
          if (elapsed >= mins) {
            await logOut();
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  async function loadSettings() {
    const biometric = await SecureStore.getItemAsync('biometric_enabled');
    setBiometricEnabled(biometric === 'true');
    const auto = await SecureStore.getItemAsync('auto_lock');
    setAutoLock(auto === 'true');
    const mins = await SecureStore.getItemAsync('auto_lock_minutes');
    setAutoLockMinutes(mins ? parseInt(mins) : 5);

    const decoy = await SecureStore.getItemAsync('decoy_enabled');
    setDecoyEnabled(decoy === 'true');
    const decoyPass = await SecureStore.getItemAsync('decoy_password');
    setDecoyPassword(decoyPass || '');

    const selfDestruct = await SecureStore.getItemAsync('self_destruct_enabled');
    setSelfDestructEnabled(selfDestruct === 'true');
  }

  async function loadStats() {
    if (isDecoy) {
      setFileCount(3);
    } else {
      const files = await listEncryptedFiles();
      setFileCount(files.length);
    }
  }

  async function handleBiometricToggle(value: boolean) {
    await SecureStore.setItemAsync('biometric_enabled', value.toString());
    setBiometricEnabled(value);
    if (value) {
      Alert.alert(
        'Biometric Enabled ✅',
        'You will be asked to authenticate next time you open the app!'
      );
    }
  }

  async function handleAutoLockToggle(value: boolean) {
    await SecureStore.setItemAsync('auto_lock', value.toString());
    setAutoLock(value);
    if (value) {
      Alert.alert(
        'Auto Lock Enabled ✅',
        `App will lock after ${autoLockMinutes} minutes of inactivity!`
      );
    }
  }

  async function handleAutoLockMinutes(mins: number) {
    await SecureStore.setItemAsync('auto_lock_minutes', mins.toString());
    setAutoLockMinutes(mins);
  }

  async function handleDecoyToggle(value: boolean) {
    if (value && !decoyPassword) {
      Alert.alert(
        'Decoy Password Required',
        'Please configure a decoy password first before enabling decoy mode.'
      );
      setDecoyEnabled(false);
      setShowDecoyInput(true);
      return;
    }
    await SecureStore.setItemAsync('decoy_enabled', value.toString());
    setDecoyEnabled(value);
  }

  async function handleSelfDestructToggle(value: boolean) {
    if (value) {
      Alert.alert(
        '⚠️ Warning: Self-Destruct',
        'If enabled, ALL your encrypted files and keys will be permanently deleted after 5 failed login attempts. Make sure you remember your password!',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setSelfDestructEnabled(false),
          },
          {
            text: 'Enable',
            style: 'destructive',
            onPress: async () => {
              await SecureStore.setItemAsync('self_destruct_enabled', 'true');
              setSelfDestructEnabled(true);
            },
          },
        ]
      );
    } else {
      await SecureStore.setItemAsync('self_destruct_enabled', 'false');
      setSelfDestructEnabled(false);
    }
  }

  async function saveDecoyPassword() {
    if (!decoyInput || decoyInput.trim() === '') {
      Alert.alert('Error', 'Decoy password cannot be empty.');
      return;
    }
    await SecureStore.setItemAsync('decoy_password', decoyInput);
    await SecureStore.setItemAsync('decoy_enabled', 'true');
    setDecoyPassword(decoyInput);
    setDecoyEnabled(true);
    setShowDecoyInput(false);
    Alert.alert(
      'Decoy Configuration Saved',
      'Entering this password at login will now open the decoy vault screen instead of your real vault.'
    );
  }

  async function handleOpenLogs() {
    const logs = await getLogs();
    setAuditLogs(logs);
    setLogsModalVisible(true);
  }

  async function handleClearLogs() {
    Alert.alert(
      'Clear Access Logs',
      'Are you sure you want to clear your security login audit logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearLogs();
            setAuditLogs([]);
            Alert.alert('Cleared ✅', 'Access logs have been wiped.');
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => await logOut(),
      },
    ]);
  }

  async function handleClearCache() {
    Alert.alert(
      'Clear All Files & Stats',
      'This will permanently delete all encrypted files and reset your decryption statistics. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            if (isDecoy) {
              setFileCount(0);
              await SecureStore.deleteItemAsync('decrypt_count_decoy');
              Alert.alert('Done', 'All encrypted files have been deleted.');
            } else {
              const files = await listEncryptedFiles();
              for (const file of files) {
                const path = getFilePath(file);
                await deleteFile(path);
              }
              setFileCount(0);
              const key = user?.uid ? `decrypt_count_${user.uid}` : 'decrypt_count';
              await SecureStore.deleteItemAsync(key);
              await SecureStore.deleteItemAsync('decrypt_count');
              await loadStats();
              Alert.alert('Done', 'All encrypted files and stats have been cleared.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>
              {user?.displayName || user?.email?.split('@')[0]}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{fileCount}</Text>
            <Text style={styles.statLabel}>Encrypted Files</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>🔐</Text>
            <Text style={styles.statLabel}>ChaCha20</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>512</Text>
            <Text style={styles.statLabel}>Bit Hash</Text>
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>🔒 Security</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Biometric Lock</Text>
              <Text style={styles.settingDesc}>Use fingerprint or face ID</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.borderDim, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Auto Lock</Text>
              <Text style={styles.settingDesc}>
                Lock app after {autoLockMinutes} min inactivity
              </Text>
            </View>
            <Switch
              value={autoLock}
              onValueChange={handleAutoLockToggle}
              trackColor={{ false: colors.borderDim, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
          {autoLock && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Lock After</Text>
                <View style={styles.minutesRow}>
                  {[1, 5, 10, 30].map((min) => (
                    <TouchableOpacity
                      key={min}
                      style={[
                        styles.minuteBtn,
                        autoLockMinutes === min && styles.minuteBtnActive,
                      ]}
                      onPress={() => handleAutoLockMinutes(min)}
                    >
                      <Text style={[
                        styles.minuteBtnText,
                        autoLockMinutes === min && styles.minuteBtnTextActive,
                      ]}>
                        {min}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
          {!isDecoy && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Decoy Vault Mode</Text>
                  <Text style={styles.settingDesc}>
                    Separate password at login to open a fake vault
                  </Text>
                </View>
                <Switch
                  value={decoyEnabled}
                  onValueChange={handleDecoyToggle}
                  trackColor={{ false: colors.borderDim, true: colors.accent }}
                  thumbColor={colors.textPrimary}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Decoy Password</Text>
                  {showDecoyInput ? (
                    <View style={styles.decoyInputRow}>
                      <TextInput
                        style={styles.decoyTextInput}
                        value={decoyInput}
                        onChangeText={setDecoyInput}
                        placeholder="Enter decoy password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                      />
                      <TouchableOpacity
                        style={styles.saveDecoyBtn}
                        onPress={saveDecoyPassword}
                      >
                        <Text style={styles.saveDecoyText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelDecoyBtn}
                        onPress={() => setShowDecoyInput(false)}
                      >
                        <Text style={styles.cancelDecoyText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setDecoyInput(decoyPassword);
                        setShowDecoyInput(true);
                      }}
                    >
                      <Text style={{ color: colors.accent, fontSize: 13, marginTop: 4 }}>
                        {decoyPassword ? '•••••••• (Tap to change)' : 'Tap to configure decoy password'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          )}
          {!isDecoy && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, selfDestructEnabled && { color: colors.danger }]}>
                    Data Self-Destruct
                  </Text>
                  <Text style={styles.settingDesc}>
                    Permanently wipe vault after 5 failed attempts
                  </Text>
                </View>
                <Switch
                  value={selfDestructEnabled}
                  onValueChange={handleSelfDestructToggle}
                  trackColor={{ false: colors.borderDim, true: colors.danger }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </>
          )}
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={handleOpenLogs}>
            <View>
              <Text style={styles.settingLabel}>Access History Log</Text>
              <Text style={styles.settingDesc}>View login history and status</Text>
            </View>
            <Text style={{ color: colors.accent, fontSize: 18 }}>📋</Text>
          </TouchableOpacity>
        </View>

        {/* Encryption Section */}
        <Text style={styles.sectionTitle}>🛡️ Encryption</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Algorithm</Text>
              <Text style={styles.settingDesc}>Current encryption method</Text>
            </View>
            <Text style={styles.settingValue}>ChaCha20</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Hash Function</Text>
              <Text style={styles.settingDesc}>Integrity verification</Text>
            </View>
            <Text style={styles.settingValue}>SHA-512</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Key Derivation</Text>
              <Text style={styles.settingDesc}>Password to key rounds</Text>
            </View>
            <Text style={styles.settingValue}>3 Rounds</Text>
          </View>
        </View>

        {/* Storage Section */}
        <Text style={styles.sectionTitle}>💾 Storage</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearCache}>
            <View>
              <Text style={[styles.settingLabel, { color: colors.danger }]}>
                Delete All Encrypted Files
              </Text>
              <Text style={styles.settingDesc}>
                Permanently remove all {fileCount} files
              </Text>
            </View>
            <Text style={{ color: colors.danger, fontSize: 18 }}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>ℹ️ About</Text>
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>App Name</Text>
            <Text style={styles.settingValue}>SecureVault</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Security Level</Text>
            <Text style={[styles.settingValue, { color: colors.success }]}>
              Military Grade 🔐
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal
        visible={logsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLogsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Security Audit Log</Text>
              <TouchableOpacity onPress={() => setLogsModalVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
            
            {auditLogs.length === 0 ? (
              <View style={styles.emptyLogs}>
                <Text style={{ color: colors.textSecondary }}>No login attempts logged yet.</Text>
              </View>
            ) : (
              <FlatList
                data={auditLogs}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={[
                        styles.logStatus,
                        { color: item.status === 'SUCCESS' ? colors.success : colors.danger }
                      ]}>
                        {item.status === 'SUCCESS' ? '✓ SUCCESS' : '✗ FAILED'}
                      </Text>
                      <Text style={styles.logTime}>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.logDetails}>{item.details}</Text>
                    <Text style={styles.logUser}>User: {item.email}</Text>
                    <Text style={styles.logDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              />
            )}

            {auditLogs.length > 0 && (
              <TouchableOpacity style={styles.clearLogsBtn} onPress={handleClearLogs}>
                <Text style={styles.clearLogsBtnText}>Wipe Audit Logs</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    margin: spacing.screen,
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: 'bold', color: colors.bg },
  userName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: { fontSize: 12, color: colors.textSecondary },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.screen,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderDim,
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
    marginHorizontal: spacing.screen,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.screen,
    borderRadius: radius.card,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderDim,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDesc: { fontSize: 12, color: colors.textSecondary },
  settingValue: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: colors.borderDim,
    marginHorizontal: 16,
  },
  minutesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  minuteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  minuteBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  minuteBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  minuteBtnTextActive: { color: colors.bg },
  logoutBtn: {
    backgroundColor: '#1a0000',
    marginHorizontal: spacing.screen,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: 'bold' },
  decoyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  decoyTextInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  saveDecoyBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
  saveDecoyText: {
    color: colors.bg,
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelDecoyBtn: {
    padding: 10,
  },
  cancelDecoyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.borderDim,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeBtnText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyLogs: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  logCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logStatus: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  logTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  logDetails: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  logUser: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  logDate: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  clearLogsBtn: {
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.button,
    padding: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  clearLogsBtnText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
});