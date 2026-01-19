import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';


type DevicesRouteProp = RouteProp<Record<string, any>, string>;

export default function DevicesPage() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute<DevicesRouteProp>();
  const [devices, setDevices] = useState<string[]>([]);

  const renderItem = useCallback(({ item }: { item: string }) => (
    <View className="p-3 border-b-[0.5px] border-gray-200 w-full">
      <Text className="text-base">{item}</Text>
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
    <View className="flex-1 bg-white items-center justify-center">


      <FlatList data={devices} renderItem={renderItem} keyExtractor={(i) => i} className="w-full mt-4" />

      <TouchableOpacity 
        className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-[#ff7d00] items-center justify-center shadow-lg" 
        onPress={() => navigation.navigate('AddDevice') } 
        accessibilityLabel="Add device"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
