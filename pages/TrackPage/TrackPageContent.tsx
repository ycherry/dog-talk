import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// 检测是否在 Expo Go 中运行
const isExpoGo = Constants.appOwnership === 'expo';

// 动态导入真实轨迹组件（仅在非Expo Go环境）
let TrackPageReal: any = null;
if (!isExpoGo) {
  TrackPageReal = require('./TrackPage.real').default;
}

export const TrackPageContent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const trackRef = useRef<any>(null);

  const toggleRecording = () => {
    if (trackRef.current) {
      if (isRecording) {
        trackRef.current.stopRecording();
      } else {
        trackRef.current.startRecording();
      }
    }
    setIsRecording(!isRecording);
  };

  return (
    <View className="flex-1 bg-white">
      {/* 根据环境渲染不同的组件 */}
      {isExpoGo ? (
        <View className="flex-1 items-center justify-center bg-gray-100">
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text className="mt-4 text-gray-500">轨迹记录 (仅在真机可用)</Text>
        </View>
      ) : (
        <TrackPageReal 
          trackRef={trackRef}
          isRecording={isRecording}
        />
      )}

      {/* 控制按钮 - 绝对定位在底部 */}
      {!isExpoGo && (
        <View className="absolute bottom-8 left-0 right-0 flex items-center">
          <TouchableOpacity
            onPress={toggleRecording}
            className={`px-12 py-4 rounded-full shadow-lg ${
              isRecording ? 'bg-red-500' : 'bg-blue-500'
            }`}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name={isRecording ? 'stop' : 'play'} 
                size={24} 
                color="white" 
              />
              <Text className="text-white text-lg font-semibold ml-2">
                {isRecording ? '停止记录' : '开始记录'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
