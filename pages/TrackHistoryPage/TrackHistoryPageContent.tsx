import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export const TrackHistoryPageContent = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadTracks();
    
    // 监听页面焦点，自动刷新
    const unsubscribe = navigation.addListener('focus', () => {
      loadTracks();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadTracks = async () => {
    try {
      const tracksData = await AsyncStorage.getItem('tracks');
      if (tracksData) {
        setTracks(JSON.parse(tracksData));
      }
    } catch (error) {
      console.error('加载轨迹失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrack = async (trackId: string) => {
    Alert.alert(
      '删除轨迹',
      '确定要删除这条轨迹吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const newTracks = tracks.filter(t => t.id !== trackId);
              await AsyncStorage.setItem('tracks', JSON.stringify(newTracks));
              setTracks(newTracks);
            } catch (error) {
              console.error('删除轨迹失败:', error);
              Alert.alert('错误', '删除轨迹失败');
            }
          }
        }
      ]
    );
  };

  const exportTrack = async (track: Track) => {
    try {
      // 导出为GPX格式
      const gpxContent = generateGPX(track);
      
      // 使用Share API分享
      await Share.share({
        message: gpxContent,
        title: track.name
      });
    } catch (error) {
      console.error('导出轨迹失败:', error);
      Alert.alert('错误', '导出轨迹失败');
    }
  };

  const generateGPX = (track: Track): string => {
    const points = track.points.map(p => 
      `    <trkpt lat="${p.lat}" lon="${p.lng}">
      <time>${new Date(p.timestamp).toISOString()}</time>
    </trkpt>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="DogTalk">
  <metadata>
    <name>${track.name}</name>
    <time>${new Date(track.startTime).toISOString()}</time>
  </metadata>
  <trk>
    <name>${track.name}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return '-';
    const duration = (endTime - startTime) / 1000; // 秒
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分`;
    } else if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  const renderTrackItem = ({ item }: { item: Track }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow-md">
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-[#E8F4FF] justify-center items-center mr-3">
          <Ionicons name="footsteps" size={24} color="#007AFF" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-800 mb-1">{item.name}</Text>
          <Text className="text-sm text-gray-400">{formatDate(item.startTime)}</Text>
        </View>
      </View>

      <View className="flex-row justify-around py-3 border-t border-b border-gray-100 mb-3">
        <View className="flex-row items-center">
          <Ionicons name="navigate" size={16} color="#666" />
          <Text className="text-sm text-gray-600 ml-1">{(item.distance / 1000).toFixed(2)} km</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time" size={16} color="#666" />
          <Text className="text-sm text-gray-600 ml-1">{formatDuration(item.startTime, item.endTime)}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location" size={16} color="#666" />
          <Text className="text-sm text-gray-600 ml-1">{item.points.length} 点</Text>
        </View>
      </View>

      <View className="flex-row justify-around">
        <TouchableOpacity 
          className="flex-row items-center py-2 px-4"
          onPress={() => exportTrack(item)}
        >
          <Ionicons name="share-outline" size={20} color="#007AFF" />
          <Text className="text-sm text-blue-500 ml-1">导出</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center py-2 px-4"
          onPress={() => deleteTrack(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text className="text-sm text-red-500 ml-1">删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-start">
        <View className="h-14 flex-row items-center justify-between px-3 border-b-[0.5px] border-gray-200 w-full">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">足迹</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-gray-400 mt-4">加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (tracks.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-start">
        <View className="h-14 flex-row items-center justify-between px-3 border-b-[0.5px] border-gray-200 w-full">
          <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">足迹</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 justify-center items-center">
          <Ionicons name="footsteps-outline" size={64} color="#ccc" />
          <Text className="text-lg text-gray-400 mt-4">还没有轨迹记录</Text>
          <Text className="text-sm text-gray-300 mt-2">前往轨迹页面开始记录</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-14 flex-row items-center justify-between px-3 border-b-[0.5px] border-gray-200 w-full">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 items-center justify-center">
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold">足迹</Text>
        <View className="w-10" />
      </View>
      <FlatList
        data={tracks}
        renderItem={renderTrackItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15 }}
      />
    </SafeAreaView>
  );
};

