import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface TalkRecord {
  id: string;
  date: string;
  time: string;
  dogName: string;
  message: string;
  type: '汪汪' | '呜呜' | '哼哼' | '吠叫';
  duration: number; // 秒
}

const mockData: TalkRecord[] = [
  {
    id: '1',
    date: '1月16日',
    time: '上午 08:35',
    dogName: '小黄',
    message: '主人，我饿了！',
    type: '汪汪',
    duration: 3,
  },
  {
    id: '2', 
    date: '1月15日',
    time: '上午 08:34',
    dogName: '小黄',
    message: '我想出去散步',
    type: '呜呜',
    duration: 5,
  },
  {
    id: '3',
    date: '1月15日',
    time: '上午 08:12',
    dogName: '小黄',
    message: '有陌生人来了',
    type: '吠叫',
    duration: 2,
  },
  {
    id: '4',
    date: '1月14日',
    time: '上午 08:14',
    dogName: '小黄',
    message: '我很开心！',
    type: '汪汪',
    duration: 4,
  },
  {
    id: '5',
    date: '1月13日',
    time: '上午 08:35',
    dogName: '小黄',
    message: '我想玩球',
    type: '哼哼',
    duration: 3,
  },
  {
    id: '6',
    date: '1月16日',
    time: '下午 12:10',
    dogName: '小黑',
    message: '我要吃零食～',
    type: '汪汪',
    duration: 2,
  },
  {
    id: '7',
    date: '1月16日',
    time: '下午 14:05',
    dogName: '大黄',
    message: '窗外有只猫',
    type: '吠叫',
    duration: 6,
  },
  {
    id: '8',
    date: '1月14日',
    time: '下午 16:22',
    dogName: '小白',
    message: '抱抱我',
    type: '呜呜',
    duration: 4,
  },
  {
    id: '9',
    date: '12月30日',
    time: '晚上 20:00',
    dogName: '豆豆',
    message: '烟花好漂亮',
    type: '哼哼',
    duration: 5,
  },
  {
    id: '10',
    date: '1月01日',
    time: '上午 09:00',
    dogName: '小黄',
    message: '新年快乐！',
    type: '汪汪',
    duration: 3,
  },
  {
    id: '11',
    date: '1月10日',
    time: '晚上 21:45',
    dogName: '球球',
    message: '不要关灯',
    type: '呜呜',
    duration: 2,
  },
  {
    id: '12',
    date: '1月12日',
    time: '上午 07:30',
    dogName: '豆豆',
    message: '快点，散步时间',
    type: '汪汪',
    duration: 4,
  },
];

export const TalkHistoryPageContent = () => {
  const navigation = useNavigation();
  const [activeType, setActiveType] = useState<'全部' | '汪汪' | '呜呜' | '哼哼' | '吠叫'>('全部');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('all');

  const types: Array<'全部' | '汪汪' | '呜呜' | '哼哼' | '吠叫'> = ['全部', '汪汪', '呜呜', '哼哼', '吠叫'];
  const timeRanges: Array<'day' | 'week' | 'month' | 'all'> = ['day', 'week', 'month', 'all'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case '汪汪': return '🐕';
      case '呜呜': return '😢';
      case '哼哼': return '😤';
      case '吠叫': return '🔊';
      default: return '🐕';
    }
  };

  const renderTalkRecord = (item: TalkRecord) => (
    <TouchableOpacity className="flex-row bg-white p-4 mb-0.5 items-center" activeOpacity={0.7} onPress={() => { /* placeholder for future action */ }}>
      <View className="w-10 h-10 rounded-full bg-[#FF8C42] justify-center items-center mr-4">
        <Text className="text-xl">{getTypeIcon(item.type)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-gray-800 mb-1">{item.type}</Text>
        <Text className="text-sm text-gray-600 mb-1.5">{item.message}</Text>
        <View className="flex-row">
          <Text className="text-xs text-gray-400 mr-4">⏱ {item.duration}秒</Text>
          <Text className="text-xs text-gray-400">🐕 {item.dogName}</Text>
        </View>
      </View>
      <Text className="text-xs text-gray-400">{item.time}</Text>
    </TouchableOpacity>
  );

  const filteredData = activeType === '全部' ? mockData : mockData.filter(d => d.type === activeType);

  // Simple time filter based on mock date strings like '1月16日'.
  // For demo, treat current month/day as today: 1月16日 (from context).
  const parseMockDateToDayDifference = (dateStr: string) => {
    // dateStr example: '1月16日' -> month=1 day=16
    const m = dateStr.match(/(\d+)月(\d+)日/);
    if (!m) return 9999;
    const month = Number(m[1]);
    const day = Number(m[2]);
    // current is 1月16日 according to context
    const currentMonth = 1;
    const currentDay = 16;
    if (month !== currentMonth) return 9999;
    return currentDay - day; // days ago
  };

  const timeFiltered = filteredData.filter(d => {
    const daysAgo = parseMockDateToDayDifference(d.date);
    switch (timeRange) {
      case 'day':
        return daysAgo === 0;
      case 'week':
        return daysAgo >= 0 && daysAgo <= 7;
      case 'month':
        return daysAgo >= 0 && daysAgo <= 31;
      case 'all':
      default:
        return true;
    }
  });

  const groupedData = timeFiltered.reduce((acc: { [key: string]: TalkRecord[] }, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <View className="flex-1 bg-white">
      {/* 头部统计区域 */}

      <View className="bg-[#FF8C42] items-center pb-10">
        <Text className="text-white text-7xl font-bold">
          {timeFiltered.length}
          <Text className="text-2xl font-normal">条对话</Text>
        </Text>
        <Text className="text-white text-base mt-2">今日新增 3 条</Text>
      </View>

      {/* 对话记录列表 */}
      {/* 顶部类型过滤 */}
      <View className="flex-row px-4 py-3 bg-white justify-around items-center">
        {types.map((typ) => (
          <TouchableOpacity
            key={typ}
            className={`px-3 py-2 rounded-2xl border ${activeType === typ ? 'bg-[#FF8C42] border-[#FF8C42]' : 'bg-white border-gray-300'}`}
            onPress={() => setActiveType(typ)}
          >
            <Text className={`text-sm ${activeType === typ ? 'text-white font-bold' : 'text-gray-600'}`}>{typ}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 bg-gray-100 px-5" showsVerticalScrollIndicator={false}>
        {Object.entries(groupedData).map(([date, records]) => (
          <View key={date} className="my-2.5">
            <Text className="text-base text-gray-400 mb-4 mt-2.5">{date}</Text>
            {records.map((record) => (
              <View key={record.id}>
                {renderTalkRecord(record)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      {/* 底部时间范围标签 */}
      <View className="flex-row bg-white py-5 px-10 justify-around border-t border-gray-200">
        {timeRanges.map((tr) => (
          <TouchableOpacity
            key={tr}
            className={`min-w-[56px] h-14 rounded-full justify-center items-center border ${timeRange === tr ? 'bg-[#FF8C42] border-[#FF8C42]' : 'border-gray-300'}`}
            onPress={() => setTimeRange(tr)}
          >
            <Text className={`text-base ${timeRange === tr ? 'text-white font-bold' : 'text-gray-400'}`}>{tr === 'day' ? '日' : tr === 'week' ? '周' : tr === 'month' ? '月' : '全部'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
