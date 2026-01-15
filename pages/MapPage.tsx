import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
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
    <View style={styles.container}>
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
      <View style={styles.rightControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnPet}>
          <Ionicons name="sync" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="volume-high" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={toggleMapType}>
          <Ionicons name="layers" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="flash" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="cube" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 左上角放大按钮 */}
      <TouchableOpacity style={styles.zoomButton}>
        <Ionicons name="add" size={32} color="#333" />
      </TouchableOpacity>

      {/* 底部中央麦克风按钮 */}
      <TouchableOpacity style={styles.micButton}>
        <Ionicons name="mic" size={32} color="white" />
      </TouchableOpacity>

      {/* 右下角定位按钮 */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnPet}>
        <Ionicons name="navigate" size={28} color="#333" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  rightControls: {
    position: 'absolute',
    right: 15,
    top: 100,
    gap: 12,
  },
  controlButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  zoomButton: {
    position: 'absolute',
    left: 15,
    top: 100,
    backgroundColor: 'white',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  micButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: '#808080',
    borderRadius: 35,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: 15,
    backgroundColor: 'white',
    borderRadius: 30,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
});
