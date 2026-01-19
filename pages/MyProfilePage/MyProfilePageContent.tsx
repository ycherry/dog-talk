import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const MyProfilePageContent = () => {
  const navigation: any = useNavigation();
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 假设已登录

  const handleLogin = () => {
    // 处理登录逻辑
    setIsLoggedIn(true);
  };

  const handleRegister = () => {
    // 处理注册逻辑
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // 处理退出登录逻辑
    setIsLoggedIn(false);
    // navigate back to Login screen and reset stack
    navigation.replace('Login');
  };

  if (!isLoggedIn) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-2xl font-bold text-center mt-12 mb-5">My Profile</Text>
        <TouchableOpacity className="bg-[#007AFF] p-4 rounded-lg mx-5 mb-2.5 items-center" onPress={handleLogin}>
          <Text className="text-white text-base font-bold">登录</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-[#34C759] p-4 rounded-lg mx-5 mb-2.5 items-center" onPress={handleRegister}>
          <Text className="text-white text-base font-bold">注册</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center p-5 border-b border-gray-200">
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }} // 占位符头像
          className="w-[100px] h-[100px] rounded-full mb-2.5"
        />
        <Text className="text-xl font-bold">John Doe</Text>
      </View>
      <View className="p-5">
        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-200">
          <Ionicons name="paw" size={24} color="#333" />
          <Text className="flex-1 text-base ml-2.5">我的宠物</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-200">
          <Ionicons name="settings" size={24} color="#333" />
          <Text className="flex-1 text-base ml-2.5">设置</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-200">
          <Ionicons name="help-circle" size={24} color="#333" />
          <Text className="flex-1 text-base ml-2.5">帮助</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-200">
          <Ionicons name="information-circle" size={24} color="#333" />
          <Text className="flex-1 text-base ml-2.5">关于</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity className="bg-[#FF3B30] p-4 rounded-lg mx-5 mb-5 items-center" onPress={handleLogout}>
        <Text className="text-white text-base font-bold">退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
