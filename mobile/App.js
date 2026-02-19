import React, { useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
// import * as Updates from 'expo-updates'; // Dimatikan sementara untuk mencegah error native module di dev build
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Mencegah splash screen menghilang otomatis
SplashScreen.preventAutoHideAsync();

import { ToastProvider } from './src/context/ToastContext';
import { OrderNotificationProvider } from './src/context/OrderNotificationContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { ChatProvider } from './src/context/ChatContext';
import { CartProvider } from './src/context/CartContext';
import { AppSettingsProvider } from './src/context/AppSettingsContext';

import AuthWelcomeScreen from './src/screens/AuthWelcomeScreen';

import GuestCheckoutScreen from './src/screens/customer/GuestCheckoutScreen';

const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <NavigationContainer ref={navigationRef}>
    <AuthStack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Welcome" component={AuthWelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="GuestCheckout" component={GuestCheckoutScreen} />
    </AuthStack.Navigator>
  </NavigationContainer>
);

const MainApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#138FEA" />
        <Text style={styles.loadingText}>Menyiapkan Sistem...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {user ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </View>
  );
};

export default function App() {
  useEffect(() => {
    // Jalankan pengecekan OTA (Saat ini dinonaktifkan karena build development belum mendukung)
    /*
    async function onFetchUpdateAsync() {
      try {
        const Updates = require('expo-updates');
        if (Updates.isEnabled) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch (error) {
        console.log("OTA update check skipped or failed:", error.message);
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
    */

    // Sembunyikan splash screen setelah 1 detik
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <SafeAreaProvider>
          <AppSettingsProvider>
            <AuthProvider>
              <OrderNotificationProvider>
                <CartProvider>
                  <ChatProvider>
                    <MainApp />
                  </ChatProvider>
                </CartProvider>
              </OrderNotificationProvider>
            </AuthProvider>
          </AppSettingsProvider>
        </SafeAreaProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  }
});
