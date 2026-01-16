import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
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

export default function TalkHistoryPage() {
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
    <TouchableOpacity style={styles.recordItem} activeOpacity={0.7} onPress={() => { /* placeholder for future action */ }}>
      <View style={styles.recordIcon}>
        <Text style={styles.iconText}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.recordContent}>
        <Text style={styles.recordType}>{item.type}</Text>
        <Text style={styles.recordMessage}>{item.message}</Text>
        <View style={styles.recordMeta}>
          <Text style={styles.metaText}>⏱ {item.duration}秒</Text>
          <Text style={styles.metaText}>🐕 {item.dogName}</Text>
        </View>
      </View>
      <Text style={styles.recordTime}>{item.time}</Text>
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
    <View style={styles.container}>
      {/* 头部统计区域 */}

      <View style={styles.statsSection}>
        <Text style={styles.totalNumber}>
          {timeFiltered.length}
          <Text style={styles.unit}>条对话</Text>
        </Text>
        <Text style={styles.subStats}>今日新增 3 条</Text>
      </View>

      {/* 对话记录列表 */}
      {/* 顶部类型过滤 */}
      <View style={styles.typeFilterSection}>
        {types.map((typ) => (
          <TouchableOpacity
            key={typ}
            style={[styles.typeFilterItem, activeType === typ && styles.activeTypeFilter]}
            onPress={() => setActiveType(typ)}
          >
            <Text style={[styles.typeFilterText, activeType === typ && styles.activeTabText]}>{typ}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.listSection} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedData).map(([date, records]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {records.map((record) => (
              <View key={record.id}>
                {renderTalkRecord(record)}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      {/* 底部时间范围标签 */}
      <View style={styles.tabSection}>
        {timeRanges.map((tr) => (
          <TouchableOpacity
            key={tr}
            style={[styles.tabItem, timeRange === tr && styles.activeTab]}
            onPress={() => setTimeRange(tr)}
          >
            <Text style={[styles.tabText, timeRange === tr && styles.activeTabText]}>{tr === 'day' ? '日' : tr === 'week' ? '周' : tr === 'month' ? '月' : '全部'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FF8C42',
  },
  leftArrow: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  arrowText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  dropdownIcon: {
    color: '#fff',
    fontSize: 16,
  },
  
  statsSection: {
    backgroundColor: '#FF8C42',
    alignItems: 'center',
    paddingBottom: 40,
  },
  totalNumber: {
    color: '#fff',
    fontSize: 72,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 24,
    fontWeight: 'normal',
  },
  subStats: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  listSection: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  typeFilterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  typeFilterItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeFilterText: {
    fontSize: 14,
    color: '#666',
  },
  activeTypeFilter: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  dateGroup: {
    marginVertical: 10,
  },
  dateHeader: {
    fontSize: 16,
    color: '#999',
    marginBottom: 15,
    marginTop: 10,
  },
  recordItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 2,
    alignItems: 'center',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8C42',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  recordContent: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recordMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  recordMeta: {
    flexDirection: 'row',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    marginRight: 15,
  },
  recordTime: {
    fontSize: 12,
    color: '#999',
  },
  tabSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 40,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tabItem: {
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTab: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
