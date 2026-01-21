import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore
import * as coordtransform from 'coordtransform';

const { width, height } = Dimensions.get('window');

interface TrackPageRealProps {
  trackRef: React.RefObject<any>;
  isRecording: boolean;
}

interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

interface Track {
  id: string;
  name: string;
  points: TrackPoint[];
  startTime: number;
  endTime?: number;
  distance: number;
}

export default function TrackPageReal({ trackRef, isRecording }: TrackPageRealProps) {
  const webViewRef = useRef<WebView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackPoint[]>([]);
  const [trackDistance, setTrackDistance] = useState(0);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const startTimeRef = useRef<number>(0);

  // 暴露方法给父组件
  useImperativeHandle(trackRef, () => ({
    startRecording: async () => {
      console.log('开始轨迹记录');
      setCurrentTrack([]);
      setTrackDistance(0);
      startTimeRef.current = Date.now();
      
      if (userLocation) {
        const firstPoint: TrackPoint = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          timestamp: Date.now()
        };
        setCurrentTrack([firstPoint]);
      }
    },
    stopRecording: async () => {
      console.log('停止轨迹记录');
      if (currentTrack.length > 0) {
        await saveTrack();
      }
    }
  }));

  const saveTrack = async () => {
    try {
      const track: Track = {
        id: Date.now().toString(),
        name: `轨迹 ${new Date().toLocaleString('zh-CN')}`,
        points: currentTrack,
        startTime: startTimeRef.current,
        endTime: Date.now(),
        distance: trackDistance
      };

      const existingTracks = await AsyncStorage.getItem('tracks');
      const tracks: Track[] = existingTracks ? JSON.parse(existingTracks) : [];
      tracks.unshift(track);
      await AsyncStorage.setItem('tracks', JSON.stringify(tracks));

      Alert.alert('成功', '轨迹已保存到足迹');
      setCurrentTrack([]);
      setTrackDistance(0);
    } catch (error) {
      console.error('保存轨迹失败:', error);
      Alert.alert('错误', '保存轨迹失败');
    }
  };

  // 计算两点间距离（米）
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

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
        });
        
        // 将WGS84坐标转换为GCJ02坐标（中国地图坐标系）
        const [gcjLng, gcjLat] = coordtransform.wgs84togcj02(location.coords.longitude, location.coords.latitude);
        const newLocation = {
          lat: gcjLat,
          lng: gcjLng,
        };
        
        setUserLocation(newLocation);
        setLocationReady(true);
        console.log('✅ 用户位置获取成功:', newLocation);

        // 开始监听位置变化
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // 每3秒更新一次
            distanceInterval: 5, // 移动5米时更新
          },
          (location) => {
            // 将WGS84坐标转换为GCJ02坐标
            const [gcjLng, gcjLat] = coordtransform.wgs84togcj02(location.coords.longitude, location.coords.latitude);
            const updatedLocation = {
              lat: gcjLat,
              lng: gcjLng,
            };
            setUserLocation(updatedLocation);
            console.log('📍 用户位置更新:', updatedLocation);

            // 如果正在记录，添加到轨迹
            if (isRecording) {
              setCurrentTrack(prev => {
                const newPoint: TrackPoint = {
                  lat: gcjLat,
                  lng: gcjLng,
                  timestamp: Date.now()
                };
                
                // 计算距离增量
                if (prev.length > 0) {
                  const lastPoint = prev[prev.length - 1];
                  const distance = calculateDistance(
                    lastPoint.lat,
                    lastPoint.lng,
                    gcjLat,
                    gcjLng
                  );
                  setTrackDistance(prevDist => prevDist + distance);
                }
                
                return [...prev, newPoint];
              });
            }
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
  }, [isRecording]);

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

  // 更新地图上的用户位置和轨迹
  useEffect(() => {
    if (webViewRef.current && isMapReady && userLocation) {
      const jsCode = `updateUserMarker(${userLocation.lat}, ${userLocation.lng}); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [userLocation, isMapReady]);

  // 更新地图上的轨迹线
  useEffect(() => {
    if (webViewRef.current && isMapReady && currentTrack.length > 0) {
      const trackPoints = JSON.stringify(currentTrack.map(p => [p.lat, p.lng]));
      const jsCode = `updateTrack(${trackPoints}); true;`;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [currentTrack, isMapReady]);

  if (!locationReady || !userLocation) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-2 text-gray-600">正在获取位置...</Text>
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
    #stats {
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      min-width: 150px;
    }
    #stats h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }
    #stats p {
      margin: 5px 0;
      font-size: 12px;
      color: #666;
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
    let userMarker = null;
    let trackPolyline = null;

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
          zoom: 16,
          zoomControl: true,
          attributionControl: false
        });

        sendLog('Step 5: Map created');

        L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
          maxZoom: 19,
          attribution: '© 高德地图',
          subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04']
        }).addTo(map);
        
        sendLog('Step 6: Layer added');
        
        setTimeout(function() {
          if (map) {
            map.invalidateSize();
            sendLog('Step 6.1: Size recalculated');
          }
        }, 100);

        sendLog('Step 7: Adding user marker');
        
        var blueIcon = L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color:#007AFF;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        userMarker = L.marker([${userLocation.lat}, ${userLocation.lng}], {
          icon: blueIcon
        }).addTo(map);
        userMarker.bindPopup('<b>我的位置</b>');
        sendLog('Step 8: User marker added');

        // 初始化轨迹线
        trackPolyline = L.polyline([], {
          color: '#FF4444',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(map);
        sendLog('Step 9: Track polyline added');

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

    function updateUserMarker(lat, lng) {
      if (!map || !userMarker) return;
      
      sendLog('Updating user marker to: ' + lat + ', ' + lng);
      try {
        userMarker.setLatLng([lat, lng]);
        map.panTo([lat, lng]);
        sendLog('User marker updated');
      } catch(e) {
        sendLog('ERROR updating user marker: ' + e.message);
      }
    }

    function updateTrack(points) {
      if (!map || !trackPolyline) return;
      
      sendLog('Updating track with ' + points.length + ' points');
      try {
        trackPolyline.setLatLngs(points);
        
        // 如果有轨迹点，调整地图视野以显示完整轨迹
        if (points.length > 1) {
          var bounds = L.latLngBounds(points);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
        
        sendLog('Track updated');
      } catch(e) {
        sendLog('ERROR updating track: ' + e.message);
      }
    }

    window.updateUserMarker = updateUserMarker;
    window.updateTrack = updateTrack;

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
        originWhitelist={['*']}
        scalesPageToFit={true}
        cacheEnabled={false}
      />
      
      {/* 轨迹统计信息 */}
      {isRecording && (
        <View className="absolute top-16 right-5 bg-white p-4 rounded-md shadow-lg min-w-[150px]">
          <Text className="text-sm font-bold text-gray-800 mb-2">轨迹记录中</Text>
          <Text className="text-xs text-gray-600 my-1">点数: {currentTrack.length}</Text>
          <Text className="text-xs text-gray-600 my-1">距离: {(trackDistance / 1000).toFixed(2)} km</Text>
        </View>
      )}
      
      {isLoading && (
        <View className="absolute inset-0 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-2 text-gray-600">正在加载地图...</Text>
          {logs.length > 0 && (
            <View className="mt-4 p-2 bg-[rgba(0,0,0,0.05)] rounded-md max-w-[80%]">
              {logs.map((log, index) => (
                <Text key={index} className="text-sm text-gray-800 my-1">{log}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}


