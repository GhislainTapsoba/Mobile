import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const QueueStats = ({ stats }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Tickets totaux : <Text style={styles.value}>{stats.totalTickets}</Text></Text>
    <Text style={styles.label}>Attente moyenne : <Text style={styles.value}>{stats.averageWaitTime}</Text></Text>
    <Text style={styles.label}>Période : <Text style={styles.value}>{stats.currentPeriod}</Text></Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#f3f3f3',
    borderRadius: 8,
    padding: 16,
  },
  label: {
    color: '#222',
    fontSize: 16,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  value: {
    color: '#0D47A1',
    fontWeight: 'normal',
  },
});

export default QueueStats;