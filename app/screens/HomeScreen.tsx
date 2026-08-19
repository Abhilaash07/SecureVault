import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { useFocusEffect } from '@react-navigation/native';
import { auth } from '../services/firebaseConfig';
import { logOut } from '../services/auth';
import { listEncryptedFiles } from '../services/fileService';
import { useSessionStore } from '../services/sessionStore';

export default function HomeScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const isDecoy = useSessionStore((state) => state.isDecoy);
  const user = useSessionStore((state) => state.user);
  const [encryptedCount, setEncryptedCount] = useState(0);
  const [decryptedCount, setDecryptedCount] = useState(0);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [isDecoy, user?.uid])
  );

  async function loadStats() {
    if (isDecoy) {
      setEncryptedCount(3);
      setRecentFiles([
        'personal_taxes_2025.pdf.enc',
        'family_travel_plans.zip.enc',
        'work_login_credentials.txt.enc',
      ]);
      const SecureStore = await import('../services/secureStore');
      const count = await SecureStore.getItemAsync('decrypt_count_decoy');
      setDecryptedCount(count ? parseInt(count) : 0);
    } else {
      const files = await listEncryptedFiles();
      const uniqueFiles = Array.from(new Set(files));
      setEncryptedCount(uniqueFiles.length);
      setRecentFiles(uniqueFiles.slice(0, 3));
      
      const SecureStore = await import('../services/secureStore');
      const currentUser = useSessionStore.getState().user;
      const key = currentUser?.uid ? `decrypt_count_${currentUser.uid}` : 'decrypt_count';
      const count = await SecureStore.getItemAsync(key);
      setDecryptedCount(count ? parseInt(count) : 0);
    }
  }

  async function handleLogout() {
    await logOut();
  }

  return (
    <SafeAreaView style={isWebDesktop ? styles.desktopContainer : styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.displayName || user?.email?.split('@')[0]}
            </Text>
          </View>
          {/* Logout only shown on mobile; sidebar handles it on desktop */}
          {!isWebDesktop && (
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>

        {isWebDesktop ? (
          <View style={styles.desktopMainRow}>
            {/* Left Column - Stats and Quick Actions */}
            <View style={styles.desktopLeftCol}>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{encryptedCount}</Text>
                  <Text style={styles.statLabel}>Encrypted</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{decryptedCount}</Text>
                  <Text style={styles.statLabel}>Decrypted</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>🔐</Text>
                  <Text style={styles.statLabel}>Secure</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.desktopActionsRow}>
                <TouchableOpacity
                  style={[styles.desktopActionCard, { borderColor: colors.accent }]}
                  onPress={() => navigation.navigate('Encrypt')}
                >
                  <Text style={styles.actionIcon}>🔒</Text>
                  <Text style={styles.actionLabel}>Encrypt File</Text>
                  <Text style={styles.actionDesc}>Secure your files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.desktopActionCard, { borderColor: colors.success }]}
                  onPress={() => navigation.navigate('Decrypt')}
                >
                  <Text style={styles.actionIcon}>🔓</Text>
                  <Text style={styles.actionLabel}>Decrypt File</Text>
                  <Text style={styles.actionDesc}>Access your files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.desktopActionCard, { borderColor: colors.warning }]}
                  onPress={() => navigation.navigate('Vault')}
                >
                  <Text style={styles.actionIcon}>🗄️</Text>
                  <Text style={styles.actionLabel}>Secure Vault</Text>
                  <Text style={styles.actionDesc}>View all files</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.desktopActionCard, { borderColor: colors.textSecondary }]}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Text style={styles.actionIcon}>⚙️</Text>
                  <Text style={styles.actionLabel}>Settings</Text>
                  <Text style={styles.actionDesc}>Manage app</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Column - Recent Files */}
            <View style={styles.desktopRightCol}>
              <Text style={styles.sectionTitle}>Recent Files</Text>
              {recentFiles.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📂</Text>
                  <Text style={styles.emptyText}>No encrypted files yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap "Encrypt File" to get started!
                  </Text>
                </View>
              ) : (
                recentFiles.map((file, index) => (
                  <View key={index} style={styles.fileCard}>
                    <Text style={styles.fileIcon}>🔒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.replace('.enc', '')}
                      </Text>
                      <Text style={styles.fileStatus}>
                        Encrypted • ChaCha20-SHA512
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : (
          /* Mobile Stacked Layout */
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{encryptedCount}</Text>
                <Text style={styles.statLabel}>Encrypted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{decryptedCount}</Text>
                <Text style={styles.statLabel}>Decrypted</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>🔐</Text>
                <Text style={styles.statLabel}>Secure</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionCard, { borderColor: colors.accent }]}
                onPress={() => navigation.navigate('Encrypt')}
              >
                <Text style={styles.actionIcon}>🔒</Text>
                <Text style={styles.actionLabel}>Encrypt File</Text>
                <Text style={styles.actionDesc}>Secure your files</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { borderColor: colors.success }]}
                onPress={() => navigation.navigate('Decrypt')}
              >
                <Text style={styles.actionIcon}>🔓</Text>
                <Text style={styles.actionLabel}>Decrypt File</Text>
                <Text style={styles.actionDesc}>Access your files</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { borderColor: colors.warning }]}
                onPress={() => navigation.navigate('Vault')}
              >
                <Text style={styles.actionIcon}>🗄️</Text>
                <Text style={styles.actionLabel}>Secure Vault</Text>
                <Text style={styles.actionDesc}>View all files</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { borderColor: colors.textSecondary }]}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.actionIcon}>⚙️</Text>
                <Text style={styles.actionLabel}>Settings</Text>
                <Text style={styles.actionDesc}>Manage app</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Files */}
            <Text style={styles.sectionTitle}>Recent Files</Text>
            {recentFiles.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyText}>No encrypted files yet</Text>
                <Text style={styles.emptySubtext}>
                  Tap "Encrypt File" to get started!
                </Text>
              </View>
            ) : (
              recentFiles.map((file, index) => (
                <View key={index} style={styles.fileCard}>
                  <Text style={styles.fileIcon}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.replace('.enc', '')}
                    </Text>
                    <Text style={styles.fileStatus}>
                      Encrypted • ChaCha20-SHA512
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.screen,
  },
  desktopContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.screen,
    width: '100%',
  },
  desktopMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 24,
    marginTop: 10,
  },
  desktopLeftCol: {
    flex: 1.8,
  },
  desktopRightCol: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderDim,
    alignSelf: 'flex-start',
    width: '100%',
  },
  desktopActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  desktopActionCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  greeting: { fontSize: 14, color: colors.textSecondary },
  email: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
    maxWidth: 200,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.button,
  },
  logoutText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  statNumber: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDesc: { fontSize: 11, color: colors.textSecondary },
  emptyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderDim,
    gap: 12,
  },
  fileIcon: { fontSize: 24 },
  fileName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  fileStatus: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
});