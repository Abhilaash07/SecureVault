import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../theme';
import { listEncryptedFiles, deleteFile, shareFile } from '../services/fileService';
import * as FileSystem from 'expo-file-system/legacy';
import { useSessionStore } from '../services/sessionStore';

export default function VaultScreen() {
  const isDecoy = useSessionStore((state) => state.isDecoy);
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [isDecoy])
  );

  async function loadFiles() {
    setLoading(true);
    if (isDecoy) {
      // Simulate loading decoy files with a small realistic delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      setFiles([
        'personal_taxes_2025.pdf.enc',
        'family_travel_plans.zip.enc',
        'work_login_credentials.txt.enc',
      ]);
    } else {
      const encFiles = await listEncryptedFiles();
      setFiles(encFiles);
    }
    setLoading(false);
  }

  async function handleDelete(fileName: string) {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete ${fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (isDecoy) {
              setFiles((prev) => prev.filter((f) => f !== fileName));
              Alert.alert('Success', 'File deleted successfully');
            } else {
              const path = FileSystem.documentDirectory + fileName;
              await deleteFile(path);
              loadFiles();
            }
          },
        },
      ]
    );
  }

  async function handleShare(fileName: string) {
    if (isDecoy) {
      Alert.alert(
        'Sharing Restricted',
        'Decoy session files cannot be shared outside the secure sandbox due to corporate security policies.'
      );
      return;
    }
    const path = FileSystem.documentDirectory + fileName;
    await shareFile(path);
  }

  function formatSize(size: number): string {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗄️ Secure Vault</Text>
        <Text style={styles.subtitle}>{files.length} encrypted files</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadFiles}
            tintColor={colors.accent}
          />
        }
      >
        {files.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No Encrypted Files</Text>
            <Text style={styles.emptySubtext}>
              Encrypt a file first and it will appear here!
            </Text>
          </View>
        ) : (
          files.map((fileName, index) => (
            <View key={index} style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileIcon}>🔒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileName.replace('.enc', '')}
                  </Text>
                  <Text style={styles.fileTag}>
                    ChaCha20-SHA512 • Encrypted
                  </Text>
                </View>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShare(fileName)}
                >
                  <Text style={styles.actionBtnText}>📤</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.danger }]}
                  onPress={() => handleDelete(fileName)}
                >
                  <Text style={styles.actionBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: spacing.screen,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    padding: spacing.screen,
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    marginHorizontal: spacing.screen,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fileIcon: { fontSize: 28 },
  fileName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileTag: {
    fontSize: 11,
    color: colors.accent,
  },
  fileActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    padding: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: { fontSize: 16 },
});