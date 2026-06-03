import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import EncryptScreen from '../screens/EncryptScreen';
import DecryptScreen from '../screens/DecryptScreen';
import VaultScreen from '../screens/VaultScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { Accelerometer } from 'expo-sensors';
import { logOut } from '../services/auth';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.6 }}>
      {emoji}
    </Text>
  );
}

export default function AppTabs() {
  useEffect(() => {
    let subscription: any;
    
    subscription = Accelerometer.addListener((data) => {
      const { x, y, z } = data;
      const acceleration = Math.sqrt(x * x + y * y + z * z);
      const shakeThreshold = 2.2;
      
      if (acceleration > shakeThreshold) {
        logOut();
      }
    });

    Accelerometer.setUpdateInterval(200);

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

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