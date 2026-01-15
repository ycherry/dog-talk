import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export default function LoginPage() {
  const navigation: any = useNavigation()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)

  function onLogin() {
    // For this task we skip real auth and navigate to Translate tab inside Main
    navigation.replace('Main', { screen: 'Translate' })
  }

  return (
    <ScrollView contentContainerStyle={styles.container} style={{flex: 1}}>

      <Text style={styles.title}>欢迎登录</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="请输入手机号"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={[styles.inputContainer, {flexDirection: 'row', alignItems: 'center'}]}>
        <TextInput
          placeholder="短信验证码"
          style={[styles.input, {flex: 1}]}
          value={code}
          onChangeText={setCode}
        />
        <TouchableOpacity>
          <Text style={styles.getCode}>获取验证码</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>新手机号将直接注册并登录</Text>
      
      <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(!agree)}>
        <View style={[styles.checkbox, agree && styles.checkboxChecked]} />
        <Text style={styles.agreeText}>已阅读并同意《用户协议》和《隐私政策》</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
        <Text style={styles.loginBtnText}>登录</Text>
      </TouchableOpacity>

      <View style={{height: 60}} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  back: {marginTop: 0},
  backText: {fontSize: 20},
  title: {fontSize: 28, color: '#123b53', marginTop: 0, fontWeight: '700', textAlign: 'center'},
  subtitle: {color: '#9aa9b1', marginTop: 6},
  inputContainer: {borderBottomWidth: 1, borderBottomColor: '#eee', marginTop: 30, paddingBottom: 6},
  input: {height: 40, fontSize: 16},
  getCode: {color: '#123b53', marginLeft: 10},
  checkboxRow: {flexDirection: 'row', alignItems: 'center', marginTop: 20},
  checkbox: {width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#ccc', marginRight: 8},
  checkboxChecked: {backgroundColor: '#123b53'},
  agreeText: {color: '#7a8a92'},
  loginBtn: {marginTop: 30, backgroundColor: '#053a56', paddingVertical: 16, borderRadius: 12, alignItems: 'center'},
  loginBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
})
