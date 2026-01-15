import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import MapPage from './pages/MapPage';
import DevicesPage from './pages/DevicesPage';
import TranslatePage from './pages/TranslatePage';
import TrajectoryPage from './pages/TrajectoryPage';
import MyProfilePage from './pages/MyProfilePage';
import LoginPage from './pages/LoginPage';
import AddDevicePage from './pages/AddDevicePage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapPage}
        options={{ 
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Devices" 
        component={DevicesPage}
        options={{ 
          title: 'Devices',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Translate" 
        component={TranslatePage}
        options={{ 
          title: 'Translate',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Trajectory" 
        component={TrajectoryPage}
        options={{ 
          title: 'Trajectory',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="navigate" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="MyProfile" 
        component={MyProfilePage}
        options={{ 
          title: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddDevice" component={AddDevicePage} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
