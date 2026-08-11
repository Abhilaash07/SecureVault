import React, { useState } from 'react';
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
import { signUp, logOut } from '../services/auth';
import * as SecureStore from 'expo-secure-store';
import { useSessionStore } from '../services/sessionStore';

export default function SignUpScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function getPasswordStrength(pass: string): { label: string; color: string; width: string } {
    if (pass.length === 0) return { label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: colors.danger, width: '25%' };
    if (pass.length < 8) return { label: 'Fair', color: colors.warning, width: '50%' };
    if (pass.length < 12) return { label: 'Strong', color: colors.success, width: '75%' };
    return { label: 'Very Strong', color: colors.success, width: '100%' };
  }

  async function handleSignUp() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    useSessionStore.getState().setIsSigningUp(true);
    const { user, error } = await signUp(email, password, name);
    if (error) {
      useSessionStore.getState().setIsSigningUp(false);
      setLoading(false);
      Alert.alert('Sign Up Failed', error);
    } else {
      try {
        await SecureStore.setItemAsync('user_display_name', name);
        const key = user?.uid ? `decrypt_count_${user.uid}` : 'decrypt_count';
        await SecureStore.setItemAsync(key, '0');
        await SecureStore.setItemAsync('decrypt_count', '0');
        
        await logOut();
        
        useSessionStore.getState().setIsSigningUp(false);
        setLoading(false);

        Alert.alert(
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
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