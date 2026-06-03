import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }
  return 'Biometric';
}

export async function authenticateWithBiometrics(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      return { success: false, error: 'Biometrics not available on this device' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      fallbackLabel: 'Use password instead',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Authentication failed' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}