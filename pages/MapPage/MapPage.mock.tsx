import React, { useState } from 'react';
import { View, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MapPageMockProps {
  onToggleMapType: () => void;
}

export default function MapPageMock({ onToggleMapType }: MapPageMockProps) {
  return (
    <>
      {/* 模拟地图背景 */}
      <View style={{ width, height, backgroundColor: '#E8F4EA' }}>
        {/* 模拟地图道路和区域 */}
        <View className="flex-1 relative">
          {/* 公园区域 */}
          <View className="absolute top-[120px] right-20 w-[200px] h-[250px] bg-[#90EE90] rounded-2xl opacity-50" />
          
          {/* 河流 */}
          <View 
            className="absolute left-0 top-[300px] w-[50%] h-20 bg-[#87CEEB] opacity-40"
            style={{ transform: [{ rotate: '-25deg' }] }}
          />
          
          {/* 道路 */}
          <View className="absolute left-0 w-full h-10 bg-[#D3D3D3] opacity-60" style={{ top: '45%' }} />
          <View className="absolute top-0 w-[35px] h-full bg-[#D3D3D3] opacity-60" style={{ left: '30%' }} />
          <View 
            className="absolute left-0 bottom-[200px] w-full h-[35px] bg-[#D3D3D3] opacity-60"
            style={{ transform: [{ rotate: '15deg' }] }}
          />
          
          {/* 建筑物 */}
          <View className="absolute w-10 h-10 bg-[#D3D3D3] border border-gray-500 opacity-70" style={{ top: 150, left: 50 }} />
          <View className="absolute w-10 h-10 bg-[#D3D3D3] border border-gray-500 opacity-70" style={{ top: 180, left: 100 }} />
          <View className="absolute w-10 h-10 bg-[#D3D3D3] border border-gray-500 opacity-70" style={{ top: 300, right: 80 }} />
          <View className="absolute w-10 h-10 bg-[#D3D3D3] border border-gray-500 opacity-70" style={{ bottom: 250, left: 70 }} />
          <View className="absolute w-10 h-10 bg-[#D3D3D3] border border-gray-500 opacity-70" style={{ bottom: 200, right: 60 }} />
        </View>

        {/* 宠物定位标记和范围 */}
        <View 
          className="absolute items-center justify-center"
          style={{ 
            top: '45%', 
            left: '50%', 
            transform: [{ translateX: -50 }, { translateY: -50 }] 
          }}
        >
          <View 
            className="w-[120px] h-[120px] rounded-full absolute border-2"
            style={{
              backgroundColor: 'rgba(135, 206, 250, 0.25)',
              borderColor: 'rgba(135, 206, 250, 0.6)',
            }}
          />
          <View className="items-center z-10">
            <View 
              className="bg-[#007AFF] rounded-full w-[50px] h-[50px] items-center justify-center border-[3px] border-white shadow-md"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 5,
              }}
            >
              <Ionicons name="paw" size={24} color="white" />
            </View>
          </View>
        </View>

        {/* 用户位置标记 */}
        <View className="absolute bottom-[320px]" style={{ left: '35%' }}>
          <View 
            className="w-4 h-4 rounded-full bg-[#007AFF] border-[3px] border-white"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
            }}
          />
        </View>

        {/* 比例尺 */}
        <View 
          className="absolute bottom-[140px] left-4 flex-row items-center px-2 py-1 rounded"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
          <View className="w-[50px] h-0.5 bg-gray-800 mr-1.5" />
          <Text className="text-[10px] text-gray-800 font-semibold">100m</Text>
        </View>

        {/* Expo Go 提示 */}
        <View 
          className="absolute top-[120px] self-center px-4 py-2 rounded-lg items-center"
          style={{ backgroundColor: 'rgba(0, 122, 255, 0.9)' }}
        >
          <Text className="text-white text-sm font-semibold">📱 Expo Go 模拟地图模式</Text>
          <Text className="text-white/80 text-[11px] mt-0.5">构建应用后将显示真实地图</Text>
        </View>
      </View>
    </>
  );
}
