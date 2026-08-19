import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive';
}

export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      // If multiple buttons, use confirm dialog
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        // Run the main action button (prefer non-cancel, or first button)
        const primaryBtn = buttons.find((b) => b.style !== 'cancel') || buttons[0];
        if (primaryBtn && primaryBtn.onPress) {
          primaryBtn.onPress();
        }
      } else {
        // Run the cancel action if present
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        if (cancelBtn && cancelBtn.onPress) {
          cancelBtn.onPress();
        }
      }
    } else if (buttons && buttons.length === 1) {
      // Single button dialog: standard alert, then run button onPress
      window.alert(`${title}\n\n${message}`);
      if (buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      // Direct standard alert
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
