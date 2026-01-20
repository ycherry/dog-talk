import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

// @ts-ignore
import * as coordtransform from 'coordtransform';

const { width, height } = Dimensions.get('window');

interface MapPageRealProps {
  onCenterOnPet: () => void;
  onToggleMapType: () => void;
  mapRef: React.RefObject<any>;
  mapType: 'standard' | 'satellite' | 'hybrid';
}

export default function MapPageReal({ 
  onCenterOnPet, 
  onToggleMapType, 
  mapRef, 
  mapType 
}: MapPageRealProps) {
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  
  const petLocationWGS = { lat: 31.218, lng: 121.475 };
  const [petGcjLng, petGcjLat] = coordtransform.wgs84togcj02(petLocationWGS.lng, petLocationWGS.lat);
  const petLocation = { lat: petGcjLat, lng: petGcjLng };

  useEffect(() => {
    const getLocation = async () => {
      try {
        console.log('正在获取位置权限...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('位置权限被拒绝，使用默认位置');
          setUserLocation({ lat: 31.22, lng: 121.48 });
          setLocationReady(true);
          return;
        }

        console.log('正在获取当前位置...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        });
        
        // 将 WGS-84 坐标转换为 GCJ-02（高德地图坐标系）
        const [gcjLng, gcjLat] = coordtransform.wgs84togcj02(
          location.coords.longitude, 
          location.coords.latitude
        );
        
        const newLocation = {
          lat: gcjLat,
          lng: gcjLng,
        };
        
        setUserLocation(newLocation);
        setLocationReady(true);
        console.log('✅ 用户位置获取成功 (GCJ-02):', newLocation);

        // 开始监听位置变化
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            enableHighAccuracy: true,
            timeInterval: 5000, // 每5秒更新一次
            distanceInterval: 10, // 移动10米时更新
          },
          (location) => {
            const [gcjLng, gcjLat] = coordtransform.wgs84togcj02(
              location.coords.longitude,
              location.coords.latitude
            );
            const updatedLocation = {
              lat: gcjLat,
              lng: gcjLng,
            };
            setUserLocation(updatedLocation);
            console.log('📍 用户位置更新 (GCJ-02):', updatedLocation);
          }
        );
      } catch (error) {
        console.error('获取位置失败:', error);
        setUserLocation({ lat: 31.22, lng: 121.48 });
        setLocationReady(true);
      }
    };

    getLocation();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      setLogs(prev => [...prev.slice(-4), data.message]);
      
      if (data.type === 'mapReady') {
        setIsLoading(false);
        setIsMapReady(true);
        console.log('✅ 地图加载成功');
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  };

  useEffect(() => {
    if (webViewRef.current && isMapReady && userLocation) {
      const jsCode = `updateUserMarker(${userLocation.lat}, ${userLocation.lng}); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [userLocation, isMapReady]);

  useEffect(() => {
    if (webViewRef.current && !isLoading) {
      const jsCode = `updateMapType('${mapType}'); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [mapType, isLoading]);

  if (!locationReady || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在获取位置...</Text>
      </View>
    );
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
    crossorigin=""/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden; 
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    #map { 
      width: 100vw; 
      height: 100vh; 
      position: absolute;
      top: 0;
      left: 0;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 9999;
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div id="loading">加载中...</div>
  <div id="map"></div>
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin="">
  </script>
  
  <script>
    function sendLog(msg) {
      try {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'log', 
            message: msg 
          }));
        }
        console.log(msg);
      } catch(e) {
        console.error('Failed to send log:', e);
      }
    }

    window.onerror = function(msg, url, line, col, error) {
      sendLog('ERROR: ' + msg + ' at line ' + line);
      return false;
    };

    sendLog('Step 1: HTML loaded');

    let map = null;
    let petMarker = null;
    let userMarker = null;
    let circle = null;
    let currentLayer = null;

    function initializeMap() {
      sendLog('Step 2: initializeMap called');
      
      if (typeof L === 'undefined') {
        sendLog('Leaflet not loaded yet, retrying...');
        setTimeout(initializeMap, 500);
        return;
      }

      sendLog('Step 3: Leaflet loaded v' + L.version);
      
      try {
        var loadingEl = document.getElementById('loading');
        if (loadingEl) loadingEl.style.display = 'none';
        
        sendLog('Step 4: Creating map');

        map = L.map('map', {
          center: [${userLocation.lat}, ${userLocation.lng}],
          zoom: 15,
          zoomControl: true,
          attributionControl: false
        });

        sendLog('Step 5: Map created');

        currentLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
          maxZoom: 19,
          attribution: '© 高德地图',
          subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04']
        });
        
        currentLayer.addTo(map);
        sendLog('Step 6: Layer added');
        
        var tilesLoaded = 0;
        currentLayer.on('tileload', function() {
          tilesLoaded++;
          if (tilesLoaded === 1) {
            sendLog('First tile loaded OK');
          }
        });
        
        currentLayer.on('tileerror', function() {
          sendLog('Tile load error');
        });
        
        setTimeout(function() {
          if (map) {
            map.invalidateSize();
            sendLog('Step 6.1: Size recalculated');
          }
        }, 100);
        
        setTimeout(function() {
          if (map) {
            map.invalidateSize();
            sendLog('Step 6.2: Size recalculated again');
          }
        }, 500);

        sendLog('Step 7: Adding markers');
        
        petMarker = L.marker([${petLocation.lat}, ${petLocation.lng}]).addTo(map);
        petMarker.bindPopup('<b>宠物位置</b>');
        sendLog('Step 7.1: Pet marker added');

        circle = L.circle([${petLocation.lat}, ${petLocation.lng}], {
          radius: 50,
          fillColor: '#87CEFA',
          color: '#87CEFA',
          weight: 2,
          fillOpacity: 0.3
        }).addTo(map);
        sendLog('Step 8: Circle added');

        var blueIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#007AFF;width:20px;height:20px;border-radius:50%;border:3px solid white;'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        userMarker = L.marker([${userLocation.lat}, ${userLocation.lng}], {
          icon: blueIcon
        }).addTo(map);
        userMarker.bindPopup('<b>我的位置</b>');
        sendLog('Step 9: User marker added');

        setTimeout(function() {
          if (map) {
            map.invalidateSize();
            sendLog('Step 10: Final size fix');
          }
        }, 1000);
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'mapReady' 
          }));
        }
        
        sendLog('Step 11: ✅ Map ready!');

      } catch(e) {
        sendLog('ERROR: ' + e.message);
        if (e.stack) sendLog('Stack: ' + e.stack);
      }
    }

    function updateMapType(type) {
      if (!map) return;
      
      sendLog('Updating map type: ' + type);
      
      try {
        if (currentLayer) {
          map.removeLayer(currentLayer);
        }

        if (type === 'satellite' || type === 'hybrid') {
          currentLayer = L.tileLayer('https://webst01.is.autonavi.com/appmaptile?style=6&size=2&scale=2&x={x}&y={y}&z={z}', {
            maxZoom: 19,
            attribution: '© 高德地图'
          });
        } else {
          currentLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
            maxZoom: 19,
            attribution: '© 高德地图',
            subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04']
          });
        }
        
        currentLayer.addTo(map);
        sendLog('Map type updated');
      } catch(e) {
        sendLog('ERROR updating type: ' + e.message);
      }
    }

    function centerOnPet() {
      if (!map) return;
      
      sendLog('Centering on pet');
      try {
        map.setView([${petLocation.lat}, ${petLocation.lng}], 17, {
          animate: true,
          duration: 0.5
        });
        
        if (petMarker) {
          petMarker.openPopup();
        }
        
        sendLog('Centered');
      } catch(e) {
        sendLog('ERROR centering: ' + e.message);
      }
    }

    function updateUserMarker(lat, lng) {
      if (!map || !userMarker) return;
      
      sendLog('Updating user marker to: ' + lat + ', ' + lng);
      try {
        userMarker.setLatLng([lat, lng]);
        sendLog('User marker updated');
      } catch(e) {
        sendLog('ERROR updating user marker: ' + e.message);
      }
    }

    window.updateMapType = updateMapType;
    window.centerOnPet = centerOnPet;
    window.updateUserMarker = updateUserMarker;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeMap, 300);
      });
    } else {
      setTimeout(initializeMap, 300);
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={{ width, height, backgroundColor: '#f0f0f0' }}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onLoadEnd={() => {
          console.log('WebView加载完成');
        }}
        onLoadStart={() => {
          console.log('WebView开始加载');
        }}
        originWhitelist={['*']}
        scalesPageToFit={true}
        cacheEnabled={false}
        incognito={false}
        thirdPartyCookiesEnabled={true}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>正在加载地图...</Text>
          {logs.length > 0 && (
            <View style={styles.logContainer}>
              {logs.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  logContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    maxWidth: '80%'
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2
  }
});
