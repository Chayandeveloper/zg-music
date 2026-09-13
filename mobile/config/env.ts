import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostAddress = () => {
  // In Expo Go or development client, hostUri is the host computer's IP (e.g., 192.168.1.4:8081)
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost') {
      return ip;
    }
  }

  if (Platform.OS === 'android') {
    // Android emulator loopback
    return '10.0.2.2';
  }
  
  return '127.0.0.1';
};

const host = getHostAddress();

export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || `http://${host}:8001/api/v1`,
  STORAGE_BASE_URL: process.env.EXPO_PUBLIC_STORAGE_BASE_URL || `http://${host}:8001`,
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Zubeefy',
};
