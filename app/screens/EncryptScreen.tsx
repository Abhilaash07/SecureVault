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
import { pickFile, readFileAsBase64, saveEncryptedFile } from '../services/fileService';
import { encryptData, generateKey, encodeBase64 } from '../services/encryption';
import { saveKey } from '../services/keyStore';
import { useSessionStore } from '../services/sessionStore';

export default function EncryptScreen() {
  const isDecoy = useSessionStore((state) => state.isDecoy);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [useAutoKey, setUseAutoKey] = useState(false);
  const [autoKey, setAutoKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [encryptedPath, setEncryptedPath] = useState('');
  const [usedAlgorithm, setUsedAlgorithm] = useState('');

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

  async function handleGenerateKey() {
    const key = await generateKey();
    setAutoKey(key);
    setUseAutoKey(true);
  }

  async function handleEncrypt() {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }
    if (!useAutoKey && !password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (!useAutoKey && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isDecoy) {
        // Simulate decoy encryption without writing real files
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setEncryptedPath('decoy_path/' + selectedFile.name + '.enc');
        setUsedAlgorithm('ChaCha20');
        setSuccess(true);
      } else {
        const fileData = await readFileAsBase64(selectedFile.uri);
        const secretKey = useAutoKey ? autoKey : password;
        const { encrypted, hash, salt, nonce, algorithm } = await encryptData(fileData, secretKey);

        const metadata = JSON.stringify({
          hash,
          salt,
          nonce,
          originalName: selectedFile.name,
          mimeType: selectedFile.mimeType,
          encryptedAt: new Date().toISOString(),
          algorithm,
        });

        const finalData = encodeBase64(unescape(encodeURIComponent(metadata))) + '.' + encrypted;
        const path = await saveEncryptedFile(finalData, selectedFile.name);
        setEncryptedPath(path);
        setUsedAlgorithm(algorithm);
        setSuccess(true);

        if (useAutoKey) {
          await saveKey(selectedFile.name, autoKey, algorithm);
        }
      }
    } catch (error: any) {
      Alert.alert('Encryption Failed', error.message);
    }
    setLoading(false);
  }

  function handleReset() {
    setSelectedFile(null);
    setPassword('');
    setConfirmPassword('');
    setAutoKey('');
    setUseAutoKey(false);
    setSuccess(false);
    setEncryptedPath('');
    setUsedAlgorithm('');
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>File Encrypted!</Text>
          <Text style={styles.successSubtitle}>Your file is now secure</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {selectedFile?.name}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Algorithm</Text>
              <Text style={[styles.detailValue, { color: colors.accent }]}>
                {usedAlgorithm}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Key Type</Text>
              <Text style={styles.detailValue}>
                {useAutoKey ? 'Auto Generated' : 'Password'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                Encrypted ✓
              </Text>
            </View>
          </View>

          {useAutoKey && (
            <View style={styles.keyCard}>
              <Text style={styles.keyLabel}>⚠️ Save your key!</Text>
              <Text style={styles.keyValue} selectable>{autoKey}</Text>
              <Text style={styles.keyWarning}>
                You need this key to decrypt the file. Store it safely!
              </Text>
            </View>
          )}

          <TouchableOpacity
  style={styles.button}
  onPress={async () => {
    if (isDecoy) {
      Alert.alert(
        'Sandbox Restriction',
        'Decoy files cannot be saved to device storage due to secure sandbox policies.'
      );
      return;
    }
    try {
      const MediaLibrary = await import('expo-media-library');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(encryptedPath);
        Alert.alert('Saved!', 'Encrypted file saved to your device storage!');
      } else {
        const { shareFile } = await import('../services/fileService');
        await shareFile(encryptedPath);
      }
    } catch {
      const { shareFile } = await import('../services/fileService');
      await shareFile(encryptedPath);
    }
  }}
>
  <Text style={styles.buttonText}>💾 Save to Device</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.shareButton}
  onPress={async () => {
    if (isDecoy) {
      Alert.alert(
        'Sharing Restricted',
        'Decoy session files cannot be shared outside the secure sandbox due to corporate security policies.'
      );
      return;
    }
    const { shareFile } = await import('../services/fileService');
    await shareFile(encryptedPath);
  }}
>
  <Text style={styles.shareButtonText}>📤 Share File</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.outlineButton} onPress={handleReset}>
  <Text style={styles.outlineButtonText}>Encrypt Another File</Text>
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
        <Text style={styles.title}>🔒 Encrypt File</Text>
        <Text style={styles.subtitle}>Secure your files with ChaCha20-SHA512</Text>

        <TouchableOpacity style={styles.filePicker} onPress={handlePickFile}>
          {selectedFile ? (
            <View style={styles.fileSelected}>
              <Text style={styles.fileIcon}>📄</Text>
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
              <Text style={styles.uploadIcon}>☁️</Text>
              <Text style={styles.uploadText}>Tap to select a file</Text>
              <Text style={styles.uploadSubtext}>
                PDF, JPG, DOCX, MP4, ZIP supported
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
            onPress={handleGenerateKey}
          >
            <Text style={[styles.toggleText, useAutoKey && styles.toggleTextActive]}>
              Auto Key
            </Text>
          </TouchableOpacity>
        </View>

        {!useAutoKey ? (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter encryption password"
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
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={{ color: colors.accent }}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.autoKeyContainer}>
            <Text style={styles.label}>Generated Key</Text>
            <Text style={styles.autoKeyText} selectable numberOfLines={2}>
              {autoKey}
            </Text>
            <Text style={styles.autoKeyWarning}>
              ⚠️ Save this key! You'll need it to decrypt the file.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleEncrypt}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.bg} />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                Encrypting...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>🔒 Encrypt Now</Text>
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
  toggleActive: { backgroundColor: colors.accent },
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
  autoKeyContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDim,
  },
  autoKeyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.accent,
    marginTop: 8,
    marginBottom: 8,
  },
  autoKeyWarning: { fontSize: 12, color: colors.warning, marginTop: 4 },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
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
    marginBottom: 16,
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
  keyCard: {
    width: '100%',
    backgroundColor: '#1a0a00',
    borderRadius: radius.card,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  keyLabel: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  keyValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.accent,
    marginBottom: 8,
  },
  keyWarning: { fontSize: 12, color: colors.textSecondary },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 10,
  },
  outlineButtonText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '600',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { padding: 14, position: 'absolute', right: 0 },
});