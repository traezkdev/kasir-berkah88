import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const HppReport = ({ navigation }) => {
  const { user } = useAuth();
  // Placeholder for future HPP report implementation
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Laporan HPP</Text>
      <Text style={styles.info}>Fitur laporan HPP akan ditampilkan di sini.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 12,
  },
  info: {
    fontSize: 16,
    color: '#64748B',
  },
});

export default HppReport;
