import React, { useState, useEffect } from 'react';
import { View, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

interface MapPageRealProps {
  onCenterOnPet: () => void;
  onToggleMapType: () => void;
  mapRef: React.RefObject<MapView>;
  mapType: 'standard' | 'satellite' | 'hybrid';
}

export default function MapPageReal({ 
  onCenterOnPet, 
  onToggleMapType, 
  mapRef, 
  mapType 
}: MapPageRealProps) {
  const [region, setRegion] = useState<Region>({
    latitude: 31.22,
    longitude: 121.48,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  
  const [petLocation] = useState<LatLng>({
    latitude: 31.218,
    longitude: 121.475,
  });

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getLocation();
  }, []);

  // 地图配置
  const mapProps = {
    ref: mapRef,
    style: { width, height },
    initialRegion: region,
    mapType,
    showsUserLocation: true,
    showsMyLocationButton: false,
    showsCompass: true,
    showsScale: true,
  };

  // 根据平台选择provider
  const provider = Platform.OS === 'android' ? 'amap' : PROVIDER_GOOGLE;

  // 公共的地图内容
  const mapContent = (
    <>
      <Marker
        coordinate={petLocation}
        title="宠物位置"
        description="您的宠物在这里"
      >
        <View className="items-center">
          <View 
            className="bg-[#007AFF] rounded-full w-[50px] h-[50px] items-center justify-center border-[3px] border-white"
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
      </Marker>

      <Circle
        center={petLocation}
        radius={50}
        fillColor="rgba(135, 206, 250, 0.3)"
        strokeColor="rgba(135, 206, 250, 0.8)"
        strokeWidth={2}
      />
    </>
  );

  return (
    <MapView {...mapProps} provider={provider}>
      {mapContent}
    </MapView>
  );
}
