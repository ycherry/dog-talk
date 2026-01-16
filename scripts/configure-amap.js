#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 配置高德地图API密钥的构建脚本
 * 在EAS构建过程中，将环境变量AMAP_API_KEY注入到AndroidManifest.xml中
 */

// 获取环境变量中的API密钥
const apiKey = process.env.AMAP_API_KEY;

if (!apiKey) {
  console.warn('警告: 未找到 AMAP_API_KEY 环境变量');
  process.exit(1);
}

// AndroidManifest.xml 路径
const manifestPath = path.join(__dirname, '../android/app/src/main/AndroidManifest.xml');

try {
  // 读取 AndroidManifest.xml
  let manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  // 替换 ${AMAP_API_KEY} 占位符
  manifestContent = manifestContent.replace('${AMAP_API_KEY}', apiKey);
  
  // 写入修改后的内容
  fs.writeFileSync(manifestPath, manifestContent);
  
  console.log('✅ 高德地图API密钥配置成功');
} catch (error) {
  console.error('❌ 配置高德地图API密钥失败:', error.message);
  process.exit(1);
}