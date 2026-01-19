import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AddDevicePage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-white"> 
      <View className="h-14 flex-row items-center justify-between px-3 border-b-[0.5px] border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">添加设备</Text>
        <View className="w-10" />
      </View>

      <View className="p-4 items-center">
        <View className="flex-row items-center w-full bg-white rounded-lg border border-gray-200 px-3 py-1.5">
          <TextInput placeholder="请输入设备ID" className="flex-1 h-11" value={deviceId} onChangeText={setDeviceId} />
          <TouchableOpacity className="w-11 h-11 items-center justify-center">
            <Ionicons name="scan" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <Text className="mt-5 text-gray-800 text-base">请在设备背面找到编码输入，或扫码添加设备</Text>

        <TouchableOpacity
          className="mt-10 w-[90%] h-14 bg-white rounded-md border-[0.5px] border-gray-200 items-center justify-center"
          onPress={() => {
            if (!deviceId || deviceId.trim().length === 0) {
              return;
            }
            // Navigate to main tabs and pass new device id to Devices tab
            // @ts-ignore
            navigation.navigate('Main', { screen: 'Devices', params: { newDeviceId: deviceId.trim() } });
          }}
        >
          <Text className="text-[#ff7d00] text-lg font-semibold">确定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
