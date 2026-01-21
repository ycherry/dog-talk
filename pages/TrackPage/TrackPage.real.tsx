import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  init, 
  Geolocation, 
  addLocationListener, 
  start, 
  stop, 
  setInterval as setAmapInterval, 
  setLocationMode, 
  setNeedAddress, 
  setDistanceFilter,
  setAllowsBackgroundLocationUpdates,
  LocationMode
} from "react-native-amap-geolocation";

const { width, height } = Dimensions.get('window');

// 请填写您的申请的高德地图Key
const AMAP_KEY_ANDROID = "5f498af4af603f8e2acef9f5eb025043";
const AMAP_KEY_IOS = "5f498af4af603f8e2acef9f5eb025043";

interface TrackPageRealProps {
  trackRef: React.RefObject<any>;
  isRecording: boolean;
}

interface TrackPoint {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy: number | null; // 修改：允许null
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
  const [userLocation, setUserLocation] = useState<{ 
    lat: number; 
    lng: number; 
    accuracy: number | null; // 修改：允许null
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [locationReady, setLocationReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackPoint[]>([]);
  const [trackDistance, setTrackDistance] = useState(0);
  const startTimeRef = useRef<number>(0);
  // 新增：记录最后一个有效点位，避免重复计算距离
  const lastValidPointRef = useRef<TrackPoint | null>(null);

  // 暴露方法给父组件
  useImperativeHandle(trackRef, () => ({
    startRecording: async () => {
      console.log('开始轨迹记录');
      setCurrentTrack([]);
      setTrackDistance(0);
      startTimeRef.current = Date.now();
      lastValidPointRef.current = null; // 重置最后一个有效点位
      
      if (userLocation && userLocation.accuracy !== null && userLocation.accuracy < 100) { // 仅使用精度<100米的点位
        const firstPoint: TrackPoint = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          timestamp: Date.now(),
          accuracy: userLocation.accuracy
        };
        setCurrentTrack([firstPoint]);
        lastValidPointRef.current = firstPoint;
      } else {
        Alert.alert('提示', '当前定位精度不足，暂无法开始记录');
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

  // 优化：计算两点间距离（米），增加合法性校验
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    // 过滤异常坐标
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    // 过滤距离过远的异常点（单次移动超过1000米，判定为定位漂移）
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance > 1000 ? 0 : distance; // 过滤漂移点
  };

  // 新增：申请高精度定位权限（适配Android 12+）
  const requestHighAccuracyPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '定位权限申请',
            message: '需要获取您的精确位置以记录轨迹',
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
        // 在 Android 上先请求 ACCESS_FINE_LOCATION，保证首次打开时弹出询问
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

        // 步骤1：初始化SDK
        await init({
          ios: AMAP_KEY_IOS,
          android: AMAP_KEY_ANDROID
        });

        // 步骤2：申请高精度权限（Android 12+）
        const hasFinePermission = await requestHighAccuracyPermission();
        if (!hasFinePermission) {
          console.log('精确位置权限被拒绝');
          Alert.alert('权限不足', '需要精确位置权限才能获取高精度定位');
          return;
        }

        // 步骤3：配置定位参数
        if (Platform.OS === 'android') {
          // Android配置
          setAmapInterval(5000); // 5秒
          setNeedAddress(false);
          setLocationMode(LocationMode.Hight_Accuracy); // 高精度模式
        } else if (Platform.OS === 'ios') {
          // iOS配置
          setDistanceFilter(3);
          setAllowsBackgroundLocationUpdates(true);
        }

        // 步骤4：添加位置监听
        locationListener = addLocationListener(location => {
          if (!location) return;
            // AMap SDK 默认返回 GCJ-02 坐标，无需再次转换
            const newLocation = {
              lat: location.latitude,
              lng: location.longitude,
              accuracy: location.accuracy
            };
          
          console.log('📍 用户位置更新 (AMap SDK), 精度:', newLocation.accuracy + '米');
          setUserLocation(newLocation);
          setLocationReady(true);

          // 将位置信息打印到 RN 控制台并发送到 WebView 以便调试定位偏差
          try {
            const payload = {
              type: 'posUpdate',
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: newLocation.accuracy,
              timestamp: Date.now(),
              coordinateSystem: 'GCJ-02' // 来自 AMap SDK
            };
            console.log('posUpdate (native):', payload);
            if (webViewRef.current) {
              const msg = JSON.stringify(payload);
              // 使用 postMessage 模拟：派发 MessageEvent 到 WebView 页面
              webViewRef.current.injectJavaScript(`(function(){ if(window.dispatchEvent){window.dispatchEvent(new MessageEvent('message', {data: '${msg}'}));} })(); true;`);
            }
          } catch (e) {
            console.warn('向WebView发送位置信息失败', e);
          }

          // 如果正在记录，且精度<100米（过滤低精度点位）
          if (isRecording && newLocation.accuracy !== null && newLocation.accuracy < 100) {
            setCurrentTrack(prev => {
              const newPoint: TrackPoint = {
                lat: newLocation.lat,
                lng: newLocation.lng,
                timestamp: Date.now(),
                accuracy: newLocation.accuracy
              };
              
              // 计算距离增量（仅和最后一个有效点计算）
              if (prev.length > 0 && lastValidPointRef.current) {
                const distance = calculateDistance(
                  lastValidPointRef.current.lat,
                  lastValidPointRef.current.lng,
                  newLocation.lat,
                  newLocation.lng
                );
                if (distance > 0) {
                  setTrackDistance(prevDist => prevDist + distance);
                }
              }
              
              lastValidPointRef.current = newPoint;
              return [...prev, newPoint];
            });
          }
        });

        // 步骤5：启动定位
        start();

      } catch (error) {
        console.error('定位初始化失败:', error);
        setUserLocation({ lat: 31.22, lng: 121.48, accuracy: 1000 });
        setLocationReady(true);
        Alert.alert('定位失败', '无法启动高德定位，请检查Key是否配置正确');
      }
    };

    getLocation();

    return () => {
      if (locationListener) {
        locationListener.remove();
      }
      stop();
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

  // 更新地图上的用户位置和轨迹（增加精度判断）
  useEffect(() => {
    if (webViewRef.current && isMapReady && userLocation) {
      // 传递精度信息给WebView
      const jsCode = `updateUserMarker(${userLocation.lat}, ${userLocation.lng}, ${userLocation.accuracy}); true;`;
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

  // 新增：支持外部切换地图类型（standard/satellite/hybrid）
  useEffect(() => {
    // 如果父组件通过 ref/prop 提供 mapType，可在这里注入
    // 示例：假设有 mapType 变量（未来可以通过 props 传入）
    // if (webViewRef.current && isMapReady && mapType) {
    //   const jsCode = `updateMapType('${mapType}'); true;`;
    //   webViewRef.current.injectJavaScript(jsCode);
    // }
  }, [isMapReady]);

  if (!locationReady || !userLocation) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 8, color: '#666' }}>正在获取位置...</Text>
      </View>
    );
  }

  // 优化HTML内容：增加精度显示
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
    .accuracy-circle {
      position: absolute;
      border: 1px solid #007AFF;
      border-radius: 50%;
      opacity: 0.2;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="loading">加载中...</div>
  <div id="stats">
    <h3>定位信息</h3>
    <p id="posInfo">等待位置...</p>
    <p id="posTimestamp" style="font-size:11px;color:#666;margin-top:6px;"></p>
    <p id="posCoordSys" style="font-size:11px;color:#666;margin-top:2px;"></p>
  </div>
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

    // 接收来自 React Native 注入的 MessageEvent（posUpdate）并展示在页面上
    window.addEventListener('message', function(e) {
      try {
        var data = e.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (err) { /* leave as string */ }
        }
        if (!data) return;

        // If this is a posUpdate, update UI and map
        if (data.type === 'posUpdate') {
          var info = 'lat: ' + data.lat + ', lng: ' + data.lng + ' (精度: ' + (data.accuracy || 'N/A') + ' 米)';
          sendLog('Received posUpdate: ' + info + ' @' + (data.timestamp || 'N/A'));
          var el = document.getElementById('posInfo');
          if (el) el.textContent = info;
          var tEl = document.getElementById('posTimestamp');
          if (tEl) tEl.textContent = '时间: ' + (data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A');
          var cEl = document.getElementById('posCoordSys');
          if (cEl) cEl.textContent = '坐标系: ' + (data.coordinateSystem || '未知');

          // call map updater if available
          if (typeof updateUserMarker === 'function') {
            updateUserMarker(Number(data.lat), Number(data.lng), Number(data.accuracy));
          }
        } else if (data.type === 'log') {
          sendLog('log from RN: ' + (data.message || ''));
        }
      } catch (err) {
        sendLog('Failed to handle message event: ' + (err && err.message ? err.message : err));
      }
    });

    sendLog('Step 1: HTML loaded');

    let map = null;
    let userMarker = null;
    let accuracyCircle = null; // 新增：精度圈
    let trackPolyline = null;
    let petMarker = null;
    let petCircle = null;
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

          // Use a safe default center (0,0) and low zoom. The page will re-center
          // when the first valid posUpdate arrives from React Native.
          map = L.map('map', {
            center: [0, 0],
            zoom: 2,
            zoomControl: true,
            attributionControl: false
          });

        sendLog('Step 5: Map created');

        // 初始使用高清高德瓦片
        currentLayer = L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=2&scale=2&style=8&x={x}&y={y}&z={z}', {
          maxZoom: 19,
          attribution: '© 高德地图',
          subdomains: ['webrd01', 'webrd02', 'webrd03', 'webrd04']
        });
        currentLayer.addTo(map);
        
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

        // Create an empty marker; it will be positioned when the first
        // posUpdate message arrives.
        userMarker = L.marker([0, 0], {
          icon: blueIcon
        }).addTo(map);
        userMarker.bindPopup('<b>我的位置</b>');
        sendLog('Step 8: User marker added (placeholder)');

        // Create accuracy circle element placeholder
        accuracyCircle = document.createElement('div');
        accuracyCircle.className = 'accuracy-circle';
        accuracyCircle.style.width = '0px';
        accuracyCircle.style.height = '0px';
        accuracyCircle.style.left = '0px';
        accuracyCircle.style.top = '0px';
        document.getElementById('map').appendChild(accuracyCircle);

        // 添加 pet marker（使用与 MapPage 相同的默认位置）
        petMarker = L.marker([31.218, 121.475]).addTo(map);
        petMarker.bindPopup('<b>宠物位置</b>');

        petCircle = L.circle([31.218, 121.475], {
          radius: 50,
          fillColor: '#87CEFA',
          color: '#87CEFA',
          weight: 2,
          fillOpacity: 0.3
        }).addTo(map);

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

    // 优化：更新用户位置时显示精度圈
    function updateUserMarker(lat, lng, accuracy) {
      if (!map || !userMarker) return;

      // Validate coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        sendLog('Invalid coords in updateUserMarker: ' + lat + ',' + lng);
        return;
      }

      const displayAccuracy = (typeof accuracy === 'number' && !isNaN(accuracy)) ? accuracy : 100; // 默认100米
      sendLog('Updating user marker to: ' + lat + ', ' + lng + ' (精度: ' + displayAccuracy + '米)');
      try {
        userMarker.setLatLng([lat, lng]);
        userMarker.setPopupContent('<b>我的位置</b><br>精度: ' + displayAccuracy + ' 米');

        // On first valid location, zoom in and center
        if (map.getZoom() < 10 || (map.getCenter().lat === 0 && map.getCenter().lng === 0)) {
          map.setView([lat, lng], 18);
        } else {
          map.panTo([lat, lng]);
        }

        // 更新精度圈
        if (accuracyCircle) {
          const point = map.latLngToContainerPoint([lat, lng]);
          accuracyCircle.style.width = (displayAccuracy * 2) + 'px';
          accuracyCircle.style.height = (displayAccuracy * 2) + 'px';
          accuracyCircle.style.left = point.x + 'px';
          accuracyCircle.style.top = point.y + 'px';
        }

        sendLog('User marker updated');
      } catch(e) {
        sendLog('ERROR updating user marker: ' + e.message);
      }
    }

    // 支持切换地图类型（复用 MapPage 的实现）
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
        map.setView([31.218, 121.475], 17, { animate: true, duration: 0.5 });
        if (petMarker) petMarker.openPopup();
        sendLog('Centered on pet');
      } catch(e) {
        sendLog('ERROR centering on pet: ' + e.message);
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
    window.updateMapType = updateMapType;
    window.centerOnPet = centerOnPet;

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
      
      {/* 轨迹统计信息（增加精度显示） */}
      {isRecording && (
        <View style={{ 
          position: 'absolute', 
          top: 64, 
          right: 20, 
          backgroundColor: 'white', 
          padding: 16, 
          borderRadius: 8, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
          minWidth: 150
        }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>轨迹记录中</Text>
          <Text style={{ fontSize: 12, color: '#666', marginVertical: 2 }}>点数: {currentTrack.length}</Text>
          <Text style={{ fontSize: 12, color: '#666', marginVertical: 2 }}>距离: {(trackDistance / 1000).toFixed(2)} km</Text>
          {userLocation && userLocation.accuracy !== null && (
            <Text style={{ fontSize: 12, color: '#666', marginVertical: 2 }}>当前精度: {userLocation.accuracy.toFixed(1)} 米</Text>
          )}
        </View>
      )}
      
      {isLoading && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'white' 
        }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 8, color: '#666' }}>正在加载地图...</Text>
          {logs.length > 0 && (
            <View style={{ 
              marginTop: 16, 
              padding: 8, 
              backgroundColor: 'rgba(0,0,0,0.05)', 
              borderRadius: 6, 
              maxWidth: '80%' 
            }}>
              {logs.map((log, index) => (
                <Text key={index} style={{ fontSize: 12, color: '#333', marginVertical: 1 }}>{log}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}