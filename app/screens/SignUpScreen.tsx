import React, { useState } from 'react';
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
import { colors, fontFamily, spacing, radius } from '../theme';
import { signUp, logOut } from '../services/auth';
import * as SecureStore from '../services/secureStore';
import { useSessionStore } from '../services/sessionStore';
import { showAlert } from '../services/alert';

export default function SignUpScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function getPasswordStrength(pass: string): { label: string; color: string; width: string; score: number } {
    if (pass.length === 0) return { label: '', color: 'transparent', width: '0%', score: 0 };
    
    let score = 0;
    const hasLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSymbol = /[^A-Za-z0-9]/.test(pass);
    
    if (hasLength) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSymbol) score += 1;
    if (pass.length >= 12) score += 1;

    if (pass.length < 8) {
      return { label: 'Weak (Min 8 chars)', color: colors.danger, width: '25%', score: 1 };
    }
    
    if (!hasSymbol || !hasUpper || !hasLower || !hasNumber) {
      if (score <= 3) {
        return { label: 'Weak (Need uppercase, numbers & symbols)', color: colors.danger, width: '25%', score: 2 };
      }
      return { label: 'Fair (Need symbols/special chars)', color: colors.warning, width: '50%', score: 3 };
    }

    if (score >= 5) {
      return { label: 'Very Strong', color: colors.success, width: '100%', score: 5 };
    }
    return { label: 'Strong', color: colors.success, width: '75%', score: 4 };
  }

  async function handleSignUp() {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    const strength = getPasswordStrength(password);
    if (strength.score < 4) {
      showAlert(
        'Weak Password',
        'For security, your password must be Strong or Very Strong. It must contain at least 8 characters, including uppercase, lowercase, numbers, and symbols/special characters.'
      );
      return;
    }
    setLoading(true);
    useSessionStore.getState().setIsSigningUp(true);
    const { user, error } = await signUp(email, password, name);
    if (error) {
      useSessionStore.getState().setIsSigningUp(false);
      setLoading(false);
      showAlert('Sign Up Failed', error);
    } else {
      try {
        await SecureStore.setItemAsync('user_display_name', name);
        const key = user?.uid ? `decrypt_count_${user.uid}` : 'decrypt_count';
        await SecureStore.setItemAsync(key, '0');
        await SecureStore.setItemAsync('decrypt_count', '0');
        
        await logOut();
        
        useSessionStore.getState().setIsSigningUp(false);
        setLoading(false);

        showAlert(
          'Success',
          'Account created successfully! Please login to your account.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } catch (e) {
        useSessionStore.getState().setIsSigningUp(false);
        setLoading(false);
        console.log('Error saving display name:', e);
      }
    }
  }

  const strength = getPasswordStrength(password);

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
        <Text style={styles.logo}>🛡️</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SecureVault today</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

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
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Create a password"
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
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Confirm your password"
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

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.outlineButtonText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderDim,
    borderRadius: 2,
  },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 80 },
  button: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  buttonText: { color: colors.bg, fontSize: 16, fontWeight: 'bold' },
  outlineButton: { alignItems: 'center', padding: 12 },
  outlineButtonText: { color: colors.accent, fontSize: 14 },
});