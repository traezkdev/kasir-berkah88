import React from 'react';
import { StyleSheet, View, Text, StatusBar, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from './src/context/ToastContext';

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
        <LoginScreen />
      )}
    </View>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </SafeAreaProvider>
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
