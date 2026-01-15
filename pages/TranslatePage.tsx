import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local images
import avatarImg from '../assets/avatar.png';
import dogImg from '../assets/dog.png';

export default function TranslatePage() {
  const [isRecording, setIsRecording] = useState(false);
  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const [leftImage, setLeftImage] = useState<ImageSourcePropType>(avatarImg);
  const [rightImage, setRightImage] = useState<ImageSourcePropType>(dogImg);

  const handleRecord = () => {
    setIsRecording(!isRecording);
    // 处理录音逻辑
  };

  const handleSwitch = () => {
    // 呼唤动画：两侧头像短暂放大然后回到原始大小
    const animLeft = Animated.sequence([
      Animated.timing(leftScale, { toValue: 1.12, duration: 150, useNativeDriver: true }),
      Animated.timing(leftScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]);
    const animRight = Animated.sequence([
      Animated.timing(rightScale, { toValue: 1.12, duration: 150, useNativeDriver: true }),
      Animated.timing(rightScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]);
    Animated.parallel([animLeft, animRight]).start();

    // 交换左右图片
    setLeftImage(prev => {
      setRightImage(prevRight => prev);
      return rightImage;
    });
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <Text style={styles.title}>宠物翻译助手</Text>

      {/* 人物和宠物头像区域（使用图片替代图标） */}
      <View style={styles.avatarSection}>
        <Animated.View style={[styles.avatarContainer, styles.iconAvatarContainer, { transform: [{ scale: leftScale }] }]}>
          <View style={styles.avatarWrapper}>
            <Image source={leftImage} style={styles.avatarImage} resizeMode="cover" />
          </View>
        </Animated.View>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwitch}>
          <Ionicons name="swap-horizontal" size={28} color="#fff" />
        </TouchableOpacity>

        <Animated.View style={[styles.avatarContainer, styles.iconAvatarContainer, { transform: [{ scale: rightScale }] }]}>
          <View style={styles.avatarWrapper}>
            <Image source={rightImage} style={[styles.avatarImage, styles.dogAvatarImage]} resizeMode="cover" />
          </View>
          <TouchableOpacity style={styles.miniSwapButton} onPress={handleSwitch}>
            <Ionicons name="swap-horizontal" size={16} color="#666" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* 音频波形显示区域 */}
      <View style={styles.waveformContainer}>
        {/* 音频波形 - 使用简单的视觉表现 */}
        <View style={styles.waveform}>
          {[...Array(40)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: Math.random() * 60 + 20,
                  opacity: isRecording ? 0.8 : 0.3,
                },
              ]}
            />
          ))}
        </View>

        {/* 录音按钮 */}
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={handleRecord}
        >
          <Ionicons name="mic" size={60} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.recordText}>点击按钮完成录制</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 30,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  dogAvatar: {
    // allow same dimensions but keep option to customize
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  dogAvatarImage: {
    // if you want the dog slightly smaller inside the wrapper
    width: '100%',
    height: '100%',
  },
  swapButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1a3d5c',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  miniSwapButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAvatar: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#1a3d5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAvatarSecondary: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#e18b4c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: 60,
  },
  waveBar: {
    width: 3,
    backgroundColor: '#cbd5e0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  recordButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#ff5252',
  },
  recordText: {
    marginTop: 30,
    fontSize: 14,
    color: '#999',
  },
});
