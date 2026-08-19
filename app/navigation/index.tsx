import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet, AppState, Platform } from 'react-native';
import { onAuthChange } from '../services/auth';
import { authenticateWithBiometrics, isBiometricAvailable } from '../services/biometric';
import AuthStack from './AuthStack';
import AppTabs from './AppTabs';
import { colors } from '../theme';
import * as SecureStore from '../services/secureStore';

import { useSessionStore } from '../services/sessionStore';

export default function RootNavigator() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      import('expo-screen-capture')
        .then(({ preventScreenCaptureAsync }) => {
          preventScreenCaptureAsync().catch(() => {});
        })
        .catch(() => {});
    }
  }, []);

  const user = useSessionStore((state) => state.user);
  const setSession = useSessionStore((state) => state.setSession);
  const [loading, setLoading] = useState(true);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [biometricFailed, setBiometricFailed] = useState(false);
  const [appIsActive, setAppIsActive] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppIsActive(nextAppState === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      const currentSession = useSessionStore.getState();
      if (currentSession.isSigningUp) {
        setLoading(false);
        return;
      }
      if (!currentSession.isDecoy && currentSession.user?.uid !== 'demo_user_id') {
        if (currentUser) {
          if (currentUser.displayName) {
            await SecureStore.setItemAsync('user_display_name', currentUser.displayName);
          }
          const savedName = await SecureStore.getItemAsync('user_display_name');
          setSession({
            email: currentUser.email,
            uid: currentUser.uid,
            displayName: currentUser.displayName || savedName || currentUser.email?.split('@')[0]
          }, false);
        } else {
          setSession(null, false);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      checkBiometric();
    }
  }, [user]);

  async function checkBiometric() {
    const enabled = await SecureStore.getItemAsync('biometric_enabled');
    if (enabled === 'true') {
      const available = await isBiometricAvailable();
      if (available) {
        setBiometricLocked(true);
        await triggerBiometric();
      }
    }
  }

  async function triggerBiometric() {
    const result = await authenticateWithBiometrics();
    if (result.success) {
      setBiometricLocked(false);
      setBiometricFailed(false);
    } else {
      setBiometricFailed(true);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E1A' }}>
      <NavigationContainer>
        {user ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>

      {/* Privacy Shield Overlay */}
      {!appIsActive && (
        <View style={[StyleSheet.absoluteFill, styles.privacyScreen, { zIndex: 99999 }]}>
          <Text style={styles.lockIcon}>🛡️</Text>
          <Text style={styles.lockTitle}>SecureVault</Text>
          <Text style={styles.lockSubtitle}>Privacy Shield Active</Text>
        </View>
      )}

      {/* Biometric Lock Overlay */}
      {user && biometricLocked && (
        <View style={[StyleSheet.absoluteFill, styles.lockScreen, { zIndex: 99998 }]}>
          <Text style={styles.lockIcon}>🔐</Text>
          <Text style={styles.lockTitle}>SecureVault</Text>
          <Text style={styles.lockSubtitle}>
            {biometricFailed
              ? 'Authentication failed. Try again.'
              : 'Authenticate to continue'}
          </Text>
          <TouchableOpacity style={styles.authBtn} onPress={triggerBiometric}>
            <Text style={styles.authBtnText}>👆 Authenticate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockIcon: { fontSize: 80, marginBottom: 20 },
  lockTitle: {
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  lockSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  authBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  authBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyScreen: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});