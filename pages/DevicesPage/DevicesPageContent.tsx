import React, { useEffect, useState, useCallback } from 'react';
import { Text, View, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


type DevicesRouteProp = RouteProp<Record<string, any>, string>;

export const DevicesPageContent = () => {
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-14 flex-row items-center justify-between px-3 border-b-[0.5px] border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">设备管理</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 items-center justify-center">
        <FlatList data={devices} renderItem={renderItem} keyExtractor={(i) => i} className="w-full mt-4" />

        <TouchableOpacity 
          className="absolute right-5 bottom-8 w-14 h-14 rounded-full bg-[#ff7d00] items-center justify-center shadow-lg" 
          onPress={() => navigation.navigate('AddDevice') } 
          accessibilityLabel="Add device"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
