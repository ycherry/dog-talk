import React, { useState, useRef, useEffect } from 'react';
import { Text, View, TouchableOpacity, Image, Animated, ImageSourcePropType, Platform, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

// Local images
import avatarImg from '../../assets/avatar.png';
import dogImg from '../../assets/dog-icon.png';

type MessageType = {
  id: string;
  type: 'dog' | 'human';
  content: string;
  audioUri?: string;
  timestamp: Date;
};

export const TranslatePageContent = () => {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const leftScale = useRef(new Animated.Value(1)).current;
  const rightScale = useRef(new Animated.Value(1)).current;
  const [leftImage, setLeftImage] = useState<ImageSourcePropType>(dogImg);
  const [rightImage, setRightImage] = useState<ImageSourcePropType>(avatarImg);
  const [recordingMode, setRecordingMode] = useState<'dog' | 'human'>('dog'); // 'dog' = 录狗语, 'human' = 录人语
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [barHeights, setBarHeights] = useState<number[]>(() => Array(40).fill(20));
  const waveformInterval = useRef<number | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);

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
      // cleanup playing sound
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, [playingSound]);

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
          
          // 模拟翻译结果并添加到消息列表
          if (recordingMode === 'dog') {
            // 录的是狗语，翻译成人语文字
            const newMessage: MessageType = {
              id: Date.now().toString(),
              type: 'dog',
              content: '阳光和你的怀抱，都是暖的。',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
          } else {
            // 录的是人语，翻译成狗语音频
            const newMessage: MessageType = {
              id: Date.now().toString(),
              type: 'human',
              content: '',
              audioUri: uri || undefined,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
          }
          
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

    // 交换左右图片和录音模式
    setLeftImage(prev => {
      setRightImage(prevRight => prev);
      return rightImage;
    });
    
    setRecordingMode(prev => prev === 'dog' ? 'human' : 'dog');
  };
  
  const playAudio = async (uri: string) => {
    try {
      // 如果已有正在播放的音频，先卸载
      if (playingSound) {
        await playingSound.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      
      setPlayingSound(sound);
      
      // 播放完成后卸载
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setPlayingSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  return (
    <View className="flex-1 bg-white pt-15 px-5">
      {/* 标题 */}
      <Text className="text-xl font-semibold text-gray-800 mb-8">Traini宠物翻译助手</Text>

      {/* 人物和宠物头像区域（使用图片替代图标） */}
      <View className="flex-row items-center justify-between mb-8 px-2.5">
        <Animated.View style={{ transform: [{ scale: leftScale }] }} className="relative items-center justify-center">
          <View className="w-[120px] h-[120px] rounded-2xl overflow-hidden bg-gray-100 items-center justify-center">
            <Image source={leftImage} className="w-full h-full" resizeMode="cover" />
          </View>
          {recordingMode === 'dog' && (
            <View className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 items-center justify-center">
              <Ionicons name="swap-horizontal" size={16} color="#666" />
            </View>
          )}
        </Animated.View>

        <TouchableOpacity className="w-14 h-14 rounded-xl bg-[#1a3d5c] items-center justify-center mx-5" onPress={handleSwitch}>
          <Ionicons name="swap-horizontal" size={28} color="#fff" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ scale: rightScale }] }} className="relative items-center justify-center">
          <View className="w-[120px] h-[120px] rounded-2xl overflow-hidden bg-gray-100 items-center justify-center">
            <Image source={rightImage} className="w-full h-full" resizeMode="cover" />
          </View>
          {recordingMode === 'human' && (
            <View className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 items-center justify-center">
              <Ionicons name="swap-horizontal" size={16} color="#666" />
            </View>
          )}
        </Animated.View>
      </View>

      {/* 音频波形显示区域 */}
      <View className="flex-1 bg-gray-100 rounded-2xl p-5 items-center justify-center">
        {/* 音频波形 - 使用简单的视觉表现 */}
        <View className="flex-row items-center justify-center h-[100px] mb-15">
          {barHeights.map((h, index) => (
            <View
              key={index}
              className="w-[3px] bg-[#cbd5e0] mx-0.5 rounded-sm"
              style={{
                height: h,
                opacity: isRecording ? 0.8 : 0.3,
              }}
            />
          ))}
        </View>

        {/* 录音按钮 */}
        <TouchableOpacity
          className={`w-[140px] h-[140px] rounded-full items-center justify-center shadow-lg ${isRecording ? 'bg-[#ff5252]' : 'bg-[#ff6b6b]'}`}
          onPress={handleRecord}
        >
          <Ionicons name={isRecording ? 'square' : 'mic'} size={60} color="#fff" />
        </TouchableOpacity>

        <Text className="mt-8 text-sm text-gray-400">{isRecording ? '录音中，点击停止' : '点击按钮完成录制'}</Text>
      </View>

      {/* 翻译消息列表 */}
      {messages.length > 0 && (
        <View className="bg-gray-50 rounded-2xl p-4 mt-4" style={{ maxHeight: 200 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {messages.map((message) => (
              <View key={message.id} className="mb-3">
                {message.type === 'dog' ? (
                  // 狗语翻译结果 - 显示文字（右侧，狗头像）
                  <View className="flex-row justify-end items-start">
                    <View className="bg-[#1a3d5c] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[70%] mr-2">
                      <Text className="text-white text-base">{message.content}</Text>
                    </View>
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                      <Image source={dogImg} className="w-full h-full" resizeMode="cover" />
                    </View>
                  </View>
                ) : (
                  // 人语翻译结果 - 显示音频播放按钮（左侧，人头像）
                  <View className="flex-row justify-start items-center">
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 mr-2">
                      <Image source={avatarImg} className="w-full h-full" resizeMode="cover" />
                    </View>
                    <TouchableOpacity
                      className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 flex-row items-center border border-gray-200"
                      onPress={() => message.audioUri && playAudio(message.audioUri)}
                    >
                      <Ionicons name="play" size={20} color="#1a3d5c" />
                      <View className="flex-row ml-2">
                        {[...Array(15)].map((_, i) => (
                          <View
                            key={i}
                            className="w-[2px] bg-gray-400 mx-0.5 rounded-sm"
                            style={{ height: 12 + Math.random() * 8 }}
                          />
                        ))}
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 底部提示文字 */}
      <Text className="text-center text-xs text-gray-400 mt-4 mb-2">该功能仅供娱乐</Text>
    </View>
  );
};
