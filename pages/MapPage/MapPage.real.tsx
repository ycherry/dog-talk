import React, { useState, useEffect, useRef } from 'react';
import { View, Dimensions, Text, ActivityIndicator, Platform, PermissionsAndroid, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  init,
  addLocationListener,
  start,
  stop,
  setInterval as setAmapInterval,
  setLocationMode,
  setNeedAddress,
  setDistanceFilter,
  setAllowsBackgroundLocationUpdates,
  LocationMode
} from 'react-native-amap-geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const AMAP_KEY_ANDROID = "5f498af4af603f8e2acef9f5eb025043";
const AMAP_KEY_IOS = "5f498af4af603f8e2acef9f5eb025043";

interface MapPageRealProps {
  onCenterOnPet?: () => void;
  onToggleMapType?: () => void;
  mapRef?: React.RefObject<any>;
  mapType?: 'standard' | 'satellite' | 'hybrid';
}

export default function MapPageReal({ onCenterOnPet, onToggleMapType, mapRef, mapType }: MapPageRealProps) {
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number | null } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // 使用固定的宠物位置（已是 GCJ-02）
  const petLocation = { lat: 31.218, lng: 121.475 };

  // 申请高精度权限（如果需要）
  const requestHighAccuracyPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '定位权限申请',
            message: '需要获取您的精确位置以显示地图',
            buttonNeutral: '稍后再问',
            buttonNegative: '取消',
            buttonPositive: '允许'
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('申请精确位置权限失败:', err);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    let locationListener: any;

    const getLocation = async () => {
      try {
        // 先请求 Android 的精确定位权限，保证首次打开时弹出询问
        if (Platform.OS === 'android') {
          try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              console.log('用户拒绝了 ACCESS_FINE_LOCATION');
            }
          } catch (err) {
            console.warn('请求ACCESS_FINE_LOCATION失败', err);
          }
        }

        await init({ ios: AMAP_KEY_IOS, android: AMAP_KEY_ANDROID });

        const hasFinePermission = await requestHighAccuracyPermission();
        if (!hasFinePermission) {
          console.log('精确位置权限被拒绝');
          Alert.alert('权限不足', '需要精确位置权限才能获取高精度定位');
          return;
        }

        if (Platform.OS === 'android') {
          setAmapInterval(5000);
          setNeedAddress(false);
          setLocationMode(LocationMode.Hight_Accuracy);
        } else if (Platform.OS === 'ios') {
          setDistanceFilter(3);
          setAllowsBackgroundLocationUpdates(true);
        }

        locationListener = addLocationListener(location => {
          if (!location) return;
          const newLocation = {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy
          };

          console.log('MapPage pos (AMap):', newLocation);
          setUserLocation(newLocation);
          setLocationReady(true);

          // 将位置信息发送到 WebView（使用与 TrackPage 相同的 dispatchEvent message 方式）
          try {
            const payload = {
              type: 'posUpdate',
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: newLocation.accuracy,
              timestamp: Date.now(),
              coordinateSystem: 'GCJ-02'
            };
            if (webViewRef.current) {
              const msg = JSON.stringify(payload).replace(/'/g, "\\'");
              webViewRef.current.injectJavaScript(`(function(){ if(window.dispatchEvent){window.dispatchEvent(new MessageEvent('message', {data: '${msg}'}));} })(); true;`);
            }
          } catch (e) {
            console.warn('向WebView发送位置信息失败', e);
          }
        });

        start();
      } catch (error) {
        console.error('定位初始化失败:', error);
        setUserLocation({ lat: 31.22, lng: 121.48, accuracy: 1000 });
        setLocationReady(true);
      }
    };

    getLocation();

    return () => {
      if (locationListener) locationListener.remove();
      stop();
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
      }
    } catch (error) {
      console.error('处理消息失败:', error);
    }
  };

  useEffect(() => {
    if (webViewRef.current && isMapReady && userLocation) {
      const jsCode = `updateUserMarker(${userLocation.lat}, ${userLocation.lng}, ${userLocation.accuracy}); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [userLocation, isMapReady]);

  useEffect(() => {
    if (webViewRef.current && !isLoading && mapType) {
      const jsCode = `updateMapType('${mapType}'); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [mapType, isLoading]);

  if (!locationReady || !userLocation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8, color: '#666' }}>正在获取位置...</Text>
      </View>
    );
  }
  // HTML 初始化为占位中心 (0,0)，WebView 将通过接收到的 posUpdate 来更新用户位置并调整视图
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

        // 占位中心，[0,0]。收到 RN 端的 posUpdate 后会通过 updateUserMarker 来设置视野
        map = L.map('map', {
          center: [0, 0],
          zoom: 2,
          zoomControl: true,
          attributionControl: false
        });

        sendLog('Step 5: Map created');

        currentLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?key=5f498af4af603f8e2acef9f5eb025043&lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
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

        // 创建占位 user marker，实际位置将在 updateUserMarker 中设置
        userMarker = L.marker([0, 0], {
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
          currentLayer = L.tileLayer('https://webst01.is.autonavi.com/appmaptile?key=5f498af4af603f8e2acef9f5eb025043&style=6&size=2&scale=2&x={x}&y={y}&z={z}', {
            maxZoom: 19,
            attribution: '© 高德地图'
          });
        } else {
          currentLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?key=5f498af4af603f8e2acef9f5eb025043&lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
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

    // 与 TrackPage 保持一致：更新用户 marker 并根据当前视图状况决定是否缩放/居中
    function updateUserMarker(lat, lng, accuracy) {
      if (!map || !userMarker) return;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        sendLog('Invalid coords in updateUserMarker: ' + lat + ',' + lng);
        return;
      }
      const displayAccuracy = (typeof accuracy === 'number' && !isNaN(accuracy)) ? accuracy : 100;
      sendLog('Updating user marker to: ' + lat + ', ' + lng + ' (精度: ' + displayAccuracy + '米)');
      try {
        userMarker.setLatLng([lat, lng]);
        userMarker.setPopupContent('<b>我的位置</b><br>精度: ' + displayAccuracy + ' 米');

        if (map.getZoom() < 10 || (map.getCenter().lat === 0 && map.getCenter().lng === 0)) {
          map.setView([lat, lng], 18);
        } else {
          map.panTo([lat, lng]);
        }

        // 如果存在 circle（宠物周边或其他），不做特殊处理
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
    <View style={{ width, height }} className="bg-[#f0f0f0]">
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
        <View className="absolute inset-0 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-2 text-base text-gray-600">正在加载地图...</Text>
          {logs.length > 0 && (
            <View className="mt-5 p-2 bg-black/5 rounded max-w-[80%]">
              {logs.map((log, index) => (
                <Text key={index} className="text-xs text-gray-800 my-1">{log}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
 
