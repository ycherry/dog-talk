import React, { useState, useRef } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import MapPageMock from './MapPage.mock';

// 检测是否在 Expo Go 中运行
const isExpoGo = Constants.appOwnership === 'expo';

// 动态导入真实地图组件（仅在非Expo Go环境）
let MapPageReal: any = null;
if (!isExpoGo) {
  MapPageReal = require('./MapPage.real').default;
}

export default function MapPage() {
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const mapRef = useRef<any>(null);

  const centerOnPet = () => {
    if (!isExpoGo && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: 31.218,
        longitude: 121.475,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    }
  };

  const toggleMapType = () => {
    setMapType(prev => {
      if (prev === 'standard') return 'satellite';
      if (prev === 'satellite') return 'hybrid';
      return 'standard';
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* 根据环境渲染不同的地图组件 */}
      {isExpoGo ? (
        <MapPageMock onToggleMapType={toggleMapType} />
      ) : (
        <MapPageReal 
          onCenterOnPet={centerOnPet}
          onToggleMapType={toggleMapType}
          mapRef={mapRef}
          mapType={mapType}
        />
      )}

      {/* 右侧控制按钮组 */}
      <View className="absolute right-4 top-[100px] gap-3">
        <TouchableOpacity 
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md" 
          onPress={centerOnPet}
        >
          <Ionicons name="sync" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md"
        >
          <Ionicons name="volume-high" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md"
          onPress={toggleMapType}
        >
          <Ionicons name="layers" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md"
        >
          <Ionicons name="flash" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-white rounded-full w-14 h-14 items-center justify-center shadow-md"
        >
          <Ionicons name="cube" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 左上角放大按钮 */}
      <TouchableOpacity 
        className="absolute left-4 top-[100px] bg-white rounded-[25px] w-[50px] h-[50px] items-center justify-center shadow-md"
      >
        <Ionicons name="add" size={32} color="#333" />
      </TouchableOpacity>

      {/* 底部中央麦克风按钮 */}
      <TouchableOpacity 
        className="absolute bottom-[120px] self-center bg-gray-500 rounded-full w-[70px] h-[70px] items-center justify-center shadow-lg"
      >
        <Ionicons name="mic" size={32} color="white" />
      </TouchableOpacity>

      {/* 右下角定位按钮 */}
      <TouchableOpacity 
        className="absolute bottom-[120px] right-4 bg-white rounded-full w-14 h-14 items-center justify-center shadow-md"
        onPress={centerOnPet}
      >
        <Ionicons name="navigate" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
}
