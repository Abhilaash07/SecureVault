import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../services/alert';
import { colors, fontFamily, spacing, radius } from '../theme';
import { signIn, sendPasswordReset } from '../services/auth';
import * as SecureStore from '../services/secureStore';
import { useSessionStore } from '../services/sessionStore';
import { logEvent } from '../services/auditLog';
import { wipeAllData } from '../services/fileService';

export default function LoginScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
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

      showAlert(
        '🚨 SECURITY SELF-DESTRUCT',
        'Excessive failed login attempts detected. The vault has self-destructed. All files and encryption keys have been permanently wiped.',
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.log('Self destruct error:', e);
      showAlert('Security Notice', 'The vault self-destruct protocol failed to execute fully.');
    }
  }

  async function handleLogin() {
    if (lockoutRemaining > 0) {
      showAlert('Lockout Active', `Too many failed attempts. Try again in ${formatLockoutTime(lockoutRemaining)}.`);
      return;
    }
    if (!email || !password) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    // Demo Account Offline Bypass
    if (email.toLowerCase() === 'demo@securevault.com' && password === 'demo123') {
      const setSession = useSessionStore.getState().setSession;
      setSession({ email: 'demo@securevault.com', uid: 'demo_user_id', displayName: 'Demo User' }, false);
      await logEvent('SUCCESS', 'Logged in using Demo Bypass', email);
      setLoading(false);
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
          showAlert('System Lockout', noticeMsg);
        } else {
          await SecureStore.setItemAsync('failed_attempts', attempts.toString());
          const remainingMsg = selfDestructEnabled === 'true'
            ? `Attempts remaining: ${3 - attempts}\nSelf-destruct warning: ${5 - totalAttempts} left before complete data wipe.`
            : `Attempts remaining: ${3 - attempts}`;
          showAlert('Login Failed', `${error}\n\n${remainingMsg}`);
        }
      } catch (e: any) {
        showAlert('Login Failed', e?.message || (typeof error === 'string' ? error : 'Authentication failed. Please check your credentials.'));
      }
    } else {
      await logEvent('SUCCESS', 'Logged in using Master Password', email);
      await SecureStore.setItemAsync('failed_attempts', '0');
      await SecureStore.setItemAsync('total_failed_attempts', '0');
      await SecureStore.deleteItemAsync('lockout_timestamp');
    }
  }

  async function handleForgotPassword() {
    if (lockoutRemaining > 0) {
      showAlert('Lockout Active', `Too many failed attempts. Try again in ${formatLockoutTime(lockoutRemaining)}.`);
      return;
    }
    if (!email) {
      showAlert(
        'Reset Password',
        'Please enter your email address in the Email field first, then tap Forgot Password.'
      );
      return;
    }
    
    showAlert(
      'Reset Password',
      `Send a password reset link to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            setLoading(true);
            const { error } = await sendPasswordReset(email);
            setLoading(false);
            if (error) {
              showAlert('Error', error);
            } else {
              showAlert('Success', `Password reset email has been sent to ${email}!`);
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={isWebDesktop ? styles.desktopCenterWrapper : { flex: 1 }}>
        <ScrollView
          contentContainerStyle={isWebDesktop ? styles.desktopCard : styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
          onPress={handleForgotPassword}
          style={styles.forgotPasswordContainer}
          disabled={lockoutRemaining > 0}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

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

        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.demoButton}
            onPress={async () => {
              setLoading(true);
              try {
                const setSession = useSessionStore.getState().setSession;
                setSession({ 
                  email: 'demo@securevault.com', 
                  uid: 'demo_user_id', 
                  displayName: 'Demo User' 
                }, false);
                await logEvent('SUCCESS', 'Logged in using Quick Demo Mode', 'demo@securevault.com');
              } catch (e) {
                console.error(e);
              }
              setLoading(false);
            }}
          >
            <Text style={styles.demoButtonText}>⚡ Quick Demo Login</Text>
          </TouchableOpacity>
        )}
        </ScrollView>
      </View>
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
  desktopCenterWrapper: {
    flex: 1,
    backgroundColor: '#05070F',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  desktopCard: {
    width: 450,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.15)',
    padding: 40,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
    alignSelf: 'center',
    marginVertical: 40,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
    marginRight: 4,
  },
  forgotPasswordText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  demoButton: {
    borderWidth: 1.5,
    borderColor: colors.success,
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0, 255, 136, 0.04)',
  },
  demoButtonText: {
    color: colors.success,
    fontSize: 15,
    fontWeight: 'bold',
  },
});