import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export const LoginPageContent = () => {
  const navigation: any = useNavigation()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [agree, setAgree] = useState(false)

  function onLogin() {
    // For this task we skip real auth and navigate to Translate tab inside Main
    navigation.replace('Main', { screen: 'Translate' })
  }

  return (
    <ScrollView contentContainerClassName="px-6 bg-white flex-grow justify-center" className="flex-1">

      <Text className="text-3xl text-[#123b53] mt-0 font-bold text-center">欢迎登录</Text>

      <View className="border-b border-gray-200 mt-8 pb-1.5">
        <TextInput
          placeholder="请输入手机号"
          className="h-10 text-base"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View className="flex-row items-center border-b border-gray-200 mt-8 pb-1.5">
        <TextInput
          placeholder="短信验证码"
          className="flex-1 h-10 text-base"
          value={code}
          onChangeText={setCode}
        />
        <TouchableOpacity>
          <Text className="text-[#123b53] ml-2.5">获取验证码</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-[#9aa9b1] mt-1.5">新手机号将直接注册并登录</Text>
      
      <TouchableOpacity className="flex-row items-center mt-5" onPress={() => setAgree(!agree)}>
        <View className={`w-[18px] h-[18px] rounded-full border border-gray-300 mr-2 ${agree ? 'bg-[#123b53]' : ''}`} />
        <Text className="text-[#7a8a92]">已阅读并同意《用户协议》和《隐私政策》</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-8 bg-[#053a56] py-4 rounded-xl items-center" onPress={onLogin}>
        <Text className="text-white text-base font-semibold">登录</Text>
      </TouchableOpacity>

      <View className="h-[60px]" />
    </ScrollView>
  )
}
