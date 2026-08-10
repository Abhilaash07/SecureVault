import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, fontFamily, spacing, radius } from '../theme';
import { signIn } from '../services/auth';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from '../services/sessionStore';
import { logEvent } from '../services/auditLog';
import { wipeAllData } from '../services/fileService';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    checkLockoutStatus();
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  async function checkLockoutStatus() {
    try {
      const rawTimestamp = await SecureStore.getItemAsync('lockout_timestamp');
      if (rawTimestamp) {
        const lockoutTime = parseInt(rawTimestamp);
        const elapsedSeconds = (Date.now() - lockoutTime) / 1000;
        const cooldownPeriod = 5 * 60; // 5 minutes
        if (elapsedSeconds < cooldownPeriod) {
          setLockoutRemaining(Math.ceil(cooldownPeriod - elapsedSeconds));
        } else {
          await SecureStore.deleteItemAsync('lockout_timestamp');
          await SecureStore.setItemAsync('failed_attempts', '0');
        }
      }
    } catch (e) {
      console.log('Error checking lockout status:', e);
    }
  }

  function formatLockoutTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  async function executeSelfDestruct() {
    try {
      // 1. Delete all encrypted files and folders
      await wipeAllData();

      // 2. Clear all key manager keys in SecureStore
      const rawIndex = await SecureStore.getItemAsync('key_index');
      if (rawIndex) {
        const index = JSON.parse(rawIndex);
        for (const keyName of index) {
          await SecureStore.deleteItemAsync(keyName);
        }
      }
      await SecureStore.deleteItemAsync('key_index');

      // 3. Clear other app security settings to start fresh
      await SecureStore.deleteItemAsync('biometric_enabled');
      await SecureStore.deleteItemAsync('auto_lock');
      await SecureStore.deleteItemAsync('auto_lock_minutes');
      await SecureStore.deleteItemAsync('decoy_enabled');
      await SecureStore.deleteItemAsync('decoy_password');
      await SecureStore.deleteItemAsync('decrypt_count');
      await SecureStore.deleteItemAsync('decrypt_count_decoy');
      await SecureStore.deleteItemAsync('access_audit_logs');
      await SecureStore.setItemAsync('self_destruct_enabled', 'false');

      // 4. Reset failed attempts
      await SecureStore.setItemAsync('failed_attempts', '0');
      await SecureStore.setItemAsync('total_failed_attempts', '0');
      await SecureStore.deleteItemAsync('lockout_timestamp');

      Alert.alert(
        '🚨 SECURITY SELF-DESTRUCT',
        'Excessive failed login attempts detected. The vault has self-destructed. All files and encryption keys have been permanently wiped.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.log('Self destruct error:', e);
      Alert.alert('Security Notice', 'The vault self-destruct protocol failed to execute fully.');
    }
  }

  async function handleLogin() {
    if (lockoutRemaining > 0) {
      Alert.alert('Lockout Active', `Too many failed attempts. Try again in ${formatLockoutTime(lockoutRemaining)}.`);
      return;
    }
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);

    try {
      const decoyEnabled = await SecureStore.getItemAsync('decoy_enabled');
      const decoyPass = await SecureStore.getItemAsync('decoy_password');

      if (decoyEnabled === 'true' && password === decoyPass) {
        const setSession = useSessionStore.getState().setSession;
        const savedName = await SecureStore.getItemAsync('user_display_name');
        setSession({ email: email, uid: 'decoy_user_id', displayName: savedName || 'Decoy User' }, true);
        await logEvent('SUCCESS', 'Logged in using Decoy Password', email);
        await SecureStore.setItemAsync('failed_attempts', '0');
        await SecureStore.setItemAsync('total_failed_attempts', '0');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Decoy auth check error:', e);
    }

    const { user, error } = await signIn(email, password);
    setLoading(false);
    
    if (error) {
      await logEvent('FAILED', `Failed attempt: ${error}`, email);
      try {
        const rawAttempts = await SecureStore.getItemAsync('failed_attempts');
        const attempts = (rawAttempts ? parseInt(rawAttempts) : 0) + 1;

        const rawTotalAttempts = await SecureStore.getItemAsync('total_failed_attempts');
        const totalAttempts = (rawTotalAttempts ? parseInt(rawTotalAttempts) : 0) + 1;
        await SecureStore.setItemAsync('total_failed_attempts', totalAttempts.toString());

        const selfDestructEnabled = await SecureStore.getItemAsync('self_destruct_enabled');

        if (selfDestructEnabled === 'true' && totalAttempts >= 5) {
          await executeSelfDestruct();
          return;
        }
        
        if (attempts >= 3) {
          const now = Date.now().toString();
          await SecureStore.setItemAsync('lockout_timestamp', now);
          await SecureStore.setItemAsync('failed_attempts', '0');
          setLockoutRemaining(300); // 5 minutes
          const noticeMsg = selfDestructEnabled === 'true'
            ? `Too many failed login attempts. Screen locked for 5 minutes.\n\nConsecutive failures: ${totalAttempts}/5 before self-destruct.`
            : 'Too many failed login attempts. Screen locked for 5 minutes.';
          Alert.alert('System Lockout', noticeMsg);
        } else {
          await SecureStore.setItemAsync('failed_attempts', attempts.toString());
          const remainingMsg = selfDestructEnabled === 'true'
            ? `Attempts remaining: ${3 - attempts}\nSelf-destruct warning: ${5 - totalAttempts} left before complete data wipe.`
            : `Attempts remaining: ${3 - attempts}`;
          Alert.alert('Login Failed', `${error}\n\n${remainingMsg}`);
        }
      } catch (e) {
        Alert.alert('Login Failed', error);
      }
    } else {
      await logEvent('SUCCESS', 'Logged in using Master Password', email);
      await SecureStore.setItemAsync('failed_attempts', '0');
      await SecureStore.setItemAsync('total_failed_attempts', '0');
      await SecureStore.deleteItemAsync('lockout_timestamp');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to SecureVault</Text>

        {lockoutRemaining > 0 && (
          <View style={styles.lockoutNotice}>
            <Text style={styles.lockoutText}>
              🚨 Cooldown Active: Try again in {formatLockoutTime(lockoutRemaining)}
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={lockoutRemaining === 0}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={lockoutRemaining === 0}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              disabled={lockoutRemaining > 0}
            >
              <Text style={{ color: colors.accent }}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, lockoutRemaining > 0 && { opacity: 0.5 }]} 
          onPress={handleLogin} 
          disabled={loading || lockoutRemaining > 0}
        >
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.outlineButtonText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.screen,
  },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
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
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { alignItems: 'center', padding: 12 },
  logoutText: { color: colors.accent, fontSize: 14 },
  lockoutNotice: {
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.card,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  lockoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 14,
  },
  outlineButton: { alignItems: 'center', padding: 12 },
  outlineButtonText: { color: colors.accent, fontSize: 14 },
});