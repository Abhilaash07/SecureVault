import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
}

export default function ResponsiveWrapper({ children }: ResponsiveWrapperProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
