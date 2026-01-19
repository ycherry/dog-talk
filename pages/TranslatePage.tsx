import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated, ImageSourcePropType, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Local images
import avatarImg from '../assets/avatar.png';
import dogImg from '../assets/dog.png';

export default function TranslatePage() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const [leftImage, setLeftImage] = useState<ImageSourcePropType>(avatarImg);
  const [rightImage, setRightImage] = useState<ImageSourcePropType>(dogImg);
  const [barHeights, setBarHeights] = useState<number[]>(() => Array(40).fill(20));
  const waveformInterval = useRef<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (waveformInterval.current != null) {
        clearInterval(waveformInterval.current);
        waveformInterval.current = null;
      }
      // stop any ongoing recording
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch (e) {
          // ignore errors during cleanup
        }
        recordingRef.current = null;
      }
    };
  }, []);

  const handleRecord = async () => {
    // Toggle recording state and start/stop actual recording
    try {
      if (!isRecording) {
        // Avoid attempting to record on simulators/emulators - they often lack microphone support
        // Prefer Device.isDevice (expo-device) but fallback to Constants.isDevice
        const isRealDevice = (Device && typeof Device.isDevice === 'boolean') ? Device.isDevice : Constants.isDevice;
        if (!isRealDevice) {
          const platformName = Platform.OS === 'ios' ? 'iOS 模拟器' : '模拟器/仿真器';
          Alert.alert(
            '无法录音',
            `${platformName} 通常不支持麦克风录制。请在真机上测试录音功能。`,
            [
              { text: '确定', onPress: () => navigation.goBack() },
            ],
            { cancelable: false }
          );
          console.warn('Recording requested on simulator; aborting. isRealDevice=false');
          return;
        }
        // check and request permissions
        const currentPermissions = await Audio.getPermissionsAsync();
        if (currentPermissions.status !== 'granted') {
          const { status: reqStatus } = await Audio.requestPermissionsAsync();
          console.log('Requested microphone permission, result:', reqStatus);
          if (reqStatus !== 'granted') {
            console.warn('Microphone permission not granted');
            return;
          }
        } else {
          console.log('Microphone permission already granted');
        }

        const audioMode: any = {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        };

        // safely add interruption modes if constants exist on Audio
        if (typeof (Audio as any).INTERRUPTION_MODE_IOS_DONT_MIX !== 'undefined') {
          audioMode.interruptionModeIOS = (Audio as any).INTERRUPTION_MODE_IOS_DONT_MIX;
        } else if (typeof (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX !== 'undefined') {
          audioMode.interruptionModeIOS = (Audio as any).INTERRUPTION_MODE_IOS_DO_NOT_MIX;
        }

        if (typeof (Audio as any).INTERRUPTION_MODE_ANDROID_DONT_MIX !== 'undefined') {
          audioMode.interruptionModeAndroid = (Audio as any).INTERRUPTION_MODE_ANDROID_DONT_MIX;
        } else if (typeof (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX !== 'undefined') {
          audioMode.interruptionModeAndroid = (Audio as any).INTERRUPTION_MODE_ANDROID_DO_NOT_MIX;
        }

        console.log('Setting audio mode:', audioMode);
        await Audio.setAudioModeAsync(audioMode);

        // small delay to ensure audio mode is applied on some devices
        await new Promise(res => setTimeout(res, 200));

        // If there is an existing recording instance, stop and unload it first
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch (e) {
            // ignore
          }
          recordingRef.current = null;
        }

        const recording = new Audio.Recording();
        // Use the preset if available, otherwise build a full options object
        // try multiple possible preset names across expo-av versions
        const a: any = Audio;
        const preset = a.RECORDING_OPTIONS_PRESET_HIGH_QUALITY || (a.RecordingOptionsPresets && (a.RecordingOptionsPresets.HIGH_QUALITY || a.RecordingOptionsPresets.HighQuality));

        let recordingOptions: any;
        if (preset) {
          recordingOptions = preset;
        } else {
          const androidOptions: any = {
            extension: '.m4a',
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          };
          const androidOutputFormat = (Audio as any).RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4;
          const androidAudioEncoder = (Audio as any).RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC;
          if (androidOutputFormat) androidOptions.outputFormat = androidOutputFormat;
          if (androidAudioEncoder) androidOptions.audioEncoder = androidAudioEncoder;

          const iosOptions: any = {
            extension: '.caf',
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          };
          const iosQuality = (Audio as any).RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH;
          if (iosQuality) iosOptions.audioQuality = iosQuality;

          recordingOptions = {
            android: androidOptions,
            ios: iosOptions,
          };
        }

        console.log('Preparing to record with options:', recordingOptions);
        try {
          await recording.prepareToRecordAsync(recordingOptions);
          console.log('prepareToRecordAsync succeeded');
        } catch (prepareErr) {
          console.error('prepareToRecordAsync failed with options:', recordingOptions, prepareErr);
          // bubble up so outer catch logs and resets state
          throw prepareErr;
        }
        await recording.startAsync();
        recordingRef.current = recording;

        // start waveform animation
        waveformInterval.current = window.setInterval(() => {
          setBarHeights(prev => prev.map(() => Math.random() * 60 + 20));
        }, 120);

        setIsRecording(true);
      } else {
        // stop recording
        const recording = recordingRef.current;
        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.warn('stopAndUnloadAsync error', e);
          }
          const uri = recording.getURI();
          setRecordingUri(uri);
          recordingRef.current = null;
        }

        // stop waveform animation
        if (waveformInterval.current != null) {
          clearInterval(waveformInterval.current);
          waveformInterval.current = null;
        }
        setBarHeights(Array(40).fill(20));
        setIsRecording(false);
      }
    } catch (err) {
      console.error('Recording error', err);
      setIsRecording(false);
    }
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
          {barHeights.map((h, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  height: h,
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
          <Ionicons name={isRecording ? 'square' : 'mic'} size={60} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.recordText}>{isRecording ? '录音中，点击停止' : '点击按钮开始录制'}</Text>
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
