import React from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from './src/context/ToastContext';
import { OrderNotificationProvider } from './src/context/OrderNotificationContext';
import { ConfirmProvider } from './src/context/ConfirmContext';
import { ChatProvider } from './src/context/ChatContext';
import { CartProvider } from './src/context/CartContext';
import { AppSettingsProvider } from './src/context/AppSettingsContext';

const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <NavigationContainer>
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
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
