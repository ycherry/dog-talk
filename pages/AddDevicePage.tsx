import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AddDevicePage() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState('');

  return (
    <SafeAreaView style={[styles.page]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>添加设备</Text>
        <View style={{width:40}} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputRow}>
          <TextInput placeholder="请输入设备ID" style={styles.input} value={deviceId} onChangeText={setDeviceId} />
          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="scan" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>请在设备背面找到编码输入，或扫码添加设备</Text>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            if (!deviceId || deviceId.trim().length === 0) {
              return;
            }
            // Navigate to main tabs and pass new device id to Devices tab
            // @ts-ignore
            navigation.navigate('Main', { screen: 'Devices', params: { newDeviceId: deviceId.trim() } });
          }}
        >
          <Text style={styles.confirmText}>确定</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 16, alignItems: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', paddingHorizontal: 12, paddingVertical: 6 },
  input: { flex: 1, height: 44 },
  scanButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scanIcon: { width: 28, height: 28, tintColor: '#333' },
  hint: { marginTop: 20, color: '#333', fontSize: 16 },
  confirmButton: { marginTop: 40, width: '90%', height: 56, backgroundColor: '#fff', borderRadius: 6, borderWidth: 0.5, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#ff7d00', fontSize: 18, fontWeight: '600' },
});
