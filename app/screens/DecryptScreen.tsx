import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { pickFile, saveDecryptedFile, shareFile } from '../services/fileService';
import { decryptData, decodeBase64 } from '../services/encryption';
import { useSessionStore } from '../services/sessionStore';

export default function DecryptScreen() {
  const isDecoy = useSessionStore((state) => state.isDecoy);
  const user = useSessionStore((state) => state.user);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useAutoKey, setUseAutoKey] = useState(false);
  const [autoKey, setAutoKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [decryptedPath, setDecryptedPath] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [algorithm, setAlgorithm] = useState('');

  async function handlePickFile() {
    try {
      const file = await pickFile();
      if (file) {
        setSelectedFile(file);
        setSuccess(false);
      }
    } catch (err: any) {
      Alert.alert('File Picker Error', err.message || 'Failed to select file');
    }
  }

  async function handleDecrypt() {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an encrypted file first');
      return;
    }
    const secretKey = useAutoKey ? autoKey : password;
    if (!secretKey) {
      Alert.alert('Error', useAutoKey ? 'Please paste your auto key' : 'Please enter the decryption password');
      return;
    }

    setLoading(true);
    try {
      if (isDecoy) {
        // Simulate decoy decryption
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const cleanName = selectedFile.name.replace('.enc', '');
        setDecryptedPath('decoy_path/' + cleanName);
        setOriginalName(cleanName);
        setAlgorithm('ChaCha20');
        setSuccess(true);

        const SecureStore = await import('expo-secure-store');
        const current = await SecureStore.getItemAsync('decrypt_count_decoy');
        const newCount = (current ? parseInt(current) : 0) + 1;
        await SecureStore.setItemAsync('decrypt_count_decoy', newCount.toString());
      } else {
        const FileSystem = await import('expo-file-system/legacy');
        const rawData = await FileSystem.readAsStringAsync(selectedFile.uri, {
          encoding: 'utf8',
        });

        const dotIndex = rawData.indexOf('.');
        if (dotIndex === -1) throw new Error('Invalid encrypted file format');

        const metadataB64 = rawData.substring(0, dotIndex);
        const encrypted = rawData.substring(dotIndex + 1);

        const metadataStr = decodeURIComponent(escape(decodeBase64(metadataB64)));
        const metadata = JSON.parse(metadataStr);

        const decrypted = await decryptData(
          encrypted,
          secretKey,
          metadata.hash,
          metadata.salt,
          metadata.nonce
        );

        if (!decrypted) {
          Alert.alert(
            'Wrong Key',
            useAutoKey
              ? 'The auto key is incorrect. Please check and try again.'
              : 'The password is incorrect. Please try again.'
          );
          setLoading(false);
          return;
        }

        const path = await saveDecryptedFile(decrypted, metadata.originalName);
        setDecryptedPath(path);
        setOriginalName(metadata.originalName);
        setAlgorithm(metadata.algorithm);
        setSuccess(true);

        const SecureStore = await import('expo-secure-store');
        const key = user?.uid ? `decrypt_count_${user.uid}` : 'decrypt_count';
        const current = await SecureStore.getItemAsync(key);
        const newCount = (current ? parseInt(current) : 0) + 1;
        await SecureStore.setItemAsync(key, newCount.toString());
      }
    } catch (error: any) {
      Alert.alert('Decryption Failed', error.message);
    }
    setLoading(false);
  }

  async function handleShare() {
    if (isDecoy) {
      Alert.alert(
        'Sharing Restricted',
        'Decoy session files cannot be shared outside the secure sandbox due to corporate security policies.'
      );
      return;
    }
    if (decryptedPath) {
      await shareFile(decryptedPath);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setPassword('');
    setAutoKey('');
    setUseAutoKey(false);
    setSuccess(false);
    setDecryptedPath('');
    setOriginalName('');
    setAlgorithm('');
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <Text style={styles.successIcon}>🔓</Text>
          <Text style={styles.successTitle}>File Decrypted!</Text>
          <Text style={styles.successSubtitle}>Your file has been restored</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {originalName}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Algorithm</Text>
              <Text style={[styles.detailValue, { color: colors.accent }]}>
                {algorithm}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Key Type</Text>
              <Text style={styles.detailValue}>
                {useAutoKey ? 'Auto Key' : 'Password'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                Decrypted ✓
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleShare}>
            <Text style={styles.buttonText}>📤 Share File</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={handleReset}>
            <Text style={styles.outlineButtonText}>Decrypt Another File</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>🔓 Decrypt File</Text>
        <Text style={styles.subtitle}>Restore your encrypted files</Text>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile}>
          {selectedFile ? (
            <View style={styles.fileSelected}>
              <Text style={styles.fileIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Text>
              </View>
              <Text style={styles.changeText}>Change</Text>
            </View>
          ) : (
            <View style={styles.fileEmpty}>
              <Text style={styles.uploadIcon}>🔒</Text>
              <Text style={styles.uploadText}>Tap to select encrypted file</Text>
              <Text style={styles.uploadSubtext}>
                Select a .enc encrypted file
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Key Method Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !useAutoKey && styles.toggleActive]}
            onPress={() => setUseAutoKey(false)}
          >
            <Text style={[styles.toggleText, !useAutoKey && styles.toggleTextActive]}>
              Use Password
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, useAutoKey && styles.toggleActive]}
            onPress={() => setUseAutoKey(true)}
          >
            <Text style={[styles.toggleText, useAutoKey && styles.toggleTextActive]}>
              Use Auto Key
            </Text>
          </TouchableOpacity>
        </View>

        {!useAutoKey ? (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Decryption Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter your decryption password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={{ color: colors.accent }}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Auto Key</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Paste your auto-generated key here"
              placeholderTextColor={colors.textMuted}
              value={autoKey}
              onChangeText={setAutoKey}
              multiline
              autoCapitalize="none"
            />
            <Text style={styles.keyHint}>
              💡 This is the key shown when you encrypted with Auto Key
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {useAutoKey
              ? '🔑 Paste the auto key that was generated during encryption'
              : 'ℹ️ Use the same password you used to encrypt the file'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleDecrypt}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.bg} />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                Decrypting...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔓 Decrypt Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.screen, paddingBottom: 40 },
  title: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 24 },
  filePicker: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  fileEmpty: { padding: 32, alignItems: 'center' },
  uploadIcon: { fontSize: 40, marginBottom: 10 },
  uploadText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  fileIcon: { fontSize: 32 },
  fileName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  fileSize: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  changeText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.button,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.button - 2,
  },
  toggleActive: { backgroundColor: colors.success },
  toggleText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  toggleTextActive: { color: colors.bg },
  inputContainer: { marginBottom: 16 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { padding: 14, position: 'absolute', right: 0 },
  keyHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: colors.bgCardLight,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  infoText: { fontSize: 13, color: colors.textSecondary },
  button: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
  },
  outlineButtonText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  successContainer: {
    padding: spacing.screen,
    alignItems: 'center',
    paddingTop: 60,
  },
  successIcon: { fontSize: 80, marginBottom: 16 },
  successTitle: {
    fontSize: 28,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDim,
  },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    maxWidth: 180,
  },
});