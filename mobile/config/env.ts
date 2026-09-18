import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHostAddress = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  // In Expo Go or development client, hostUri is the host computer's IP (e.g., 192.168.1.7:8081)
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
  
  return '192.168.1.6';
};

const host = getHostAddress();

const PROD_API_URL = 'https://fillosoft.com/jubeefy/api/v1';
const PROD_STORAGE_URL = 'https://fillosoft.com/jubeefy/api';

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  // Production / Release APK builds default to live server
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return PROD_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8001/api/v1`;
  }
  return `http://${host}:8001/api/v1`;
};

const getStorageBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_STORAGE_BASE_URL) {
    return process.env.EXPO_PUBLIC_STORAGE_BASE_URL;
  }
  // Production / Release APK builds default to live server
  if (typeof __DEV__ !== 'undefined' && !__DEV__) {
    return PROD_STORAGE_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:8001`;
  }
  return `http://${host}:8001`;
};

export const ENV = {
  API_BASE_URL: getApiBaseUrl(),
  STORAGE_BASE_URL: getStorageBaseUrl(),
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Zubeefy',
};
