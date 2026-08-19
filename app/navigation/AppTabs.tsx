import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Text,
  Platform,
  useWindowDimensions,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import EncryptScreen from '../screens/EncryptScreen';
import DecryptScreen from '../screens/DecryptScreen';
import VaultScreen from '../screens/VaultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Accelerometer } from 'expo-sensors';
import { logOut } from '../services/auth';
import { useNavigationState, useNavigation } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

const NAV_ITEMS = [
  { name: 'Home', emoji: '🏠', label: 'Home' },
  { name: 'Encrypt', emoji: '🔒', label: 'Encrypt' },
  { name: 'Decrypt', emoji: '🔓', label: 'Decrypt' },
  { name: 'Vault', emoji: '🗄️', label: 'Vault' },
  { name: 'Settings', emoji: '⚙️', label: 'Settings' },
];

function DesktopSidebar() {
  const navigation = useNavigation() as any;
  const routeName = useNavigationState(
    (state) => state?.routes?.[state.index]?.name ?? 'Home'
  );

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.sidebarLogo}>
        <Text style={styles.sidebarLogoIcon}>🔐</Text>
        <Text style={styles.sidebarLogoText}>SecureVault</Text>
      </View>

      {/* Nav Items */}
      <View style={styles.sidebarNav}>
        {NAV_ITEMS.map((item) => {
          const isActive = routeName === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
              onPress={() => navigation.navigate(item.name)}
            >
              <Text style={[styles.sidebarItemEmoji, isActive && styles.sidebarItemEmojiActive]}>
                {item.emoji}
              </Text>
              <Text style={[styles.sidebarItemLabel, isActive && styles.sidebarItemLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.sidebarActiveBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <TouchableOpacity style={styles.sidebarLogout} onPress={() => logOut()}>
        <Text style={styles.sidebarLogoutIcon}>🚪</Text>
        <Text style={styles.sidebarLogoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.desktopRoot}>
      <DesktopSidebar />
      <View style={styles.desktopContent}>{children}</View>
    </View>
  );
}

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isWebDesktop = Platform.OS === 'web' && width > 768;

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: any;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        if (!available) return;
        subscription = Accelerometer.addListener((data) => {
          const { x, y, z } = data;
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const shakeThreshold = 2.2;

          if (acceleration > shakeThreshold) {
            logOut();
          }
        });
        Accelerometer.setUpdateInterval(200);
      })
      .catch(() => {});

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  if (isWebDesktop) {
    // On desktop web: use sidebar layout with custom navigation
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
        tabBar={() => null}
      >
        <Tab.Screen name="Home">
          {(props) => (
            <DesktopLayout>
              <HomeScreen {...props} />
            </DesktopLayout>
          )}
        </Tab.Screen>
        <Tab.Screen name="Encrypt">
          {(props) => (
            <DesktopLayout>
              <EncryptScreen {...(props as any)} />
            </DesktopLayout>
          )}
        </Tab.Screen>
        <Tab.Screen name="Decrypt">
          {(props) => (
            <DesktopLayout>
              <DecryptScreen {...(props as any)} />
            </DesktopLayout>
          )}
        </Tab.Screen>
        <Tab.Screen name="Vault">
          {(props) => (
            <DesktopLayout>
              <VaultScreen {...(props as any)} />
            </DesktopLayout>
          )}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {(props) => (
            <DesktopLayout>
              <SettingsScreen {...(props as any)} />
            </DesktopLayout>
          )}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  // Mobile: standard bottom tab bar
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1117',
          borderTopColor: 'rgba(0,212,255,0.2)',
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: '#8892A4',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Encrypt"
        component={EncryptScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔒" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Decrypt"
        component={DecryptScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔓" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Vault"
        component={VaultScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗄️" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#05070F',
  },
  sidebar: {
    width: 220,
    backgroundColor: '#0A0D1A',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,212,255,0.12)',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 36,
  },
  sidebarLogoIcon: { fontSize: 26 },
  sidebarLogoText: {
    color: '#00D4FF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sidebarNav: {
    flex: 1,
    gap: 4,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(0,212,255,0.1)',
  },
  sidebarItemEmoji: {
    fontSize: 18,
    opacity: 0.55,
  },
  sidebarItemEmojiActive: {
    opacity: 1,
  },
  sidebarItemLabel: {
    fontSize: 14,
    color: '#8892A4',
    fontWeight: '500',
  },
  sidebarItemLabelActive: {
    color: '#00D4FF',
    fontWeight: '700',
  },
  sidebarActiveBar: {
    position: 'absolute',
    left: 0,
    top: '20%' as any,
    bottom: '20%' as any,
    width: 3,
    backgroundColor: '#00D4FF',
    borderRadius: 2,
  },
  sidebarLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.25)',
    marginTop: 16,
  },
  sidebarLogoutIcon: { fontSize: 16 },
  sidebarLogoutText: {
    color: '#FF5050',
    fontSize: 13,
    fontWeight: '600',
  },
  desktopContent: {
    flex: 1,
    backgroundColor: '#05070F',
    overflow: 'hidden' as any,
  },
});