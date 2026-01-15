import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MyProfilePage() {
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
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>登录</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
          <Text style={styles.buttonText}>注册</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }} // 占位符头像
          style={styles.avatar}
        />
        <Text style={styles.username}>John Doe</Text>
      </View>
      <View style={styles.options}>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="paw" size={24} color="#333" />
          <Text style={styles.optionText}>我的宠物</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="settings" size={24} color="#333" />
          <Text style={styles.optionText}>设置</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="help-circle" size={24} color="#333" />
          <Text style={styles.optionText}>帮助</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Ionicons name="information-circle" size={24} color="#333" />
          <Text style={styles.optionText}>关于</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  options: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
