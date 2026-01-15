import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MapPageMockProps {
  onToggleMapType: () => void;
}

export default function MapPageMock({ onToggleMapType }: MapPageMockProps) {
  return (
    <>
      {/* 模拟地图背景 */}
      <View style={styles.map}>
        {/* 模拟地图道路和区域 */}
        <View style={styles.mapOverlay}>
          {/* 公园区域 */}
          <View style={styles.parkArea} />
          
          {/* 河流 */}
          <View style={styles.river} />
          
          {/* 道路 */}
          <View style={[styles.road, styles.road1]} />
          <View style={[styles.road, styles.road2]} />
          <View style={[styles.road, styles.road3]} />
          
          {/* 建筑物 */}
          <View style={[styles.building, { top: 150, left: 50 }]} />
          <View style={[styles.building, { top: 180, left: 100 }]} />
          <View style={[styles.building, { top: 300, right: 80 }]} />
          <View style={[styles.building, { bottom: 250, left: 70 }]} />
          <View style={[styles.building, { bottom: 200, right: 60 }]} />
        </View>

        {/* 宠物定位标记和范围 */}
        <View style={styles.petLocationContainer}>
          <View style={styles.petCircle} />
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Ionicons name="paw" size={24} color="white" />
            </View>
          </View>
        </View>

        {/* 用户位置标记 */}
        <View style={styles.userLocation}>
          <View style={styles.userLocationDot} />
        </View>

        {/* 比例尺 */}
        <View style={styles.scaleBar}>
          <View style={styles.scaleBarLine} />
          <Text style={styles.scaleText}>100m</Text>
        </View>

        {/* Expo Go 提示 */}
        <View style={styles.expoGoNotice}>
          <Text style={styles.noticeText}>📱 Expo Go 模拟地图模式</Text>
          <Text style={styles.noticeSubtext}>构建应用后将显示真实地图</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: width,
    height: height,
    backgroundColor: '#E8F4EA',
  },
  mapOverlay: {
    flex: 1,
    position: 'relative',
  },
  parkArea: {
    position: 'absolute',
    top: 120,
    right: 80,
    width: 200,
    height: 250,
    backgroundColor: '#90EE90',
    borderRadius: 20,
    opacity: 0.5,
  },
  river: {
    position: 'absolute',
    left: 0,
    top: 300,
    width: '50%',
    height: 80,
    backgroundColor: '#87CEEB',
    opacity: 0.4,
    transform: [{ rotate: '-25deg' }],
  },
  road: {
    position: 'absolute',
    backgroundColor: '#D3D3D3',
    opacity: 0.6,
  },
  road1: {
    left: 0,
    top: '45%',
    width: '100%',
    height: 40,
  },
  road2: {
    left: '30%',
    top: 0,
    width: 35,
    height: '100%',
  },
  road3: {
    left: 0,
    bottom: 200,
    width: '100%',
    height: 35,
    transform: [{ rotate: '15deg' }],
  },
  building: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: '#D3D3D3',
    borderWidth: 1,
    borderColor: '#999',
    opacity: 0.7,
  },
  petLocationContainer: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(135, 206, 250, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(135, 206, 250, 0.6)',
    position: 'absolute',
  },
  markerContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  marker: {
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userLocation: {
    position: 'absolute',
    bottom: 320,
    left: '35%',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  scaleBar: {
    position: 'absolute',
    bottom: 140,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scaleBarLine: {
    width: 50,
    height: 2,
    backgroundColor: '#333',
    marginRight: 5,
  },
  scaleText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  expoGoNotice: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  noticeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noticeSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
});
