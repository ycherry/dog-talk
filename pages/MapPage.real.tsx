import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
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
  const [region, setRegion] = useState({
    latitude: 31.22,
    longitude: 121.48,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  
  const [petLocation] = useState({
    latitude: 31.218,
    longitude: 121.475,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    })();
  }, []);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      mapType={mapType}
      provider={PROVIDER_GOOGLE}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={true}
      showsScale={true}
    >
      <Marker
        coordinate={petLocation}
        title="宠物位置"
        description="您的宠物在这里"
      >
        <View style={styles.markerContainer}>
          <View style={styles.marker}>
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
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: 'center',
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
});
