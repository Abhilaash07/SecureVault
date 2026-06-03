import { useCallback } from 'react';
import { View } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import RootNavigator from './app/navigation';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0A0E1A' }}
      onLayout={onLayoutRootView}
    >
      <RootNavigator />
    </View>
  );
}