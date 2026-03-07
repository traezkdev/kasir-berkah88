import 'react-native-gesture-handler';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CallProvider } from './src/context/CallContext';
import InCallScreen from './src/screens/InCallScreen';

export default function App() {
  return (
    <CallProvider>
      <AppNavigator />
      <InCallScreen />
    </CallProvider>
  );
}
