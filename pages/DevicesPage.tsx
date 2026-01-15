import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


type DevicesRouteProp = RouteProp<Record<string, any>, string>;

export default function DevicesPage() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute<DevicesRouteProp>();
  const [devices, setDevices] = useState<string[]>([]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <View style={{ padding: 12, borderBottomWidth: 0.5, borderColor: '#eee', width: '100%' }}>
      <Text style={{ fontSize: 16 }}>{item}</Text>
    </View>
  ), []);

  useEffect(() => {
    const anyParams = (route.params || {}) as any;
    if (anyParams.newDeviceId) {
      const id = String(anyParams.newDeviceId);
      setDevices(prev => [id, ...prev]);
      // clear to avoid duplicate adds
      // @ts-ignore
      navigation.setParams({ newDeviceId: undefined });
    }
  }, [route.params]);

  return (
    <View style={styles.container}>


      <FlatList data={devices} renderItem={renderItem} keyExtractor={(i) => i} style={{ width: '100%', marginTop: 16 }} />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddDevice') } accessibilityLabel="Add device">
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff7d00',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
