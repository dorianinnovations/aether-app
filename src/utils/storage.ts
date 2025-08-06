// AsyncStorage wrapper utilities

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

export const setStorageItem = async (key: string, value: unknown): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    logger.error(`Error storing ${key}:`, error);
    throw error;
  }
};

export const getStorageItem = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    logger.error(`Error retrieving ${key}:`, error);
    return null;
  }
};

export const removeStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    logger.error(`Error removing ${key}:`, error);
    throw error;
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    logger.error('Error clearing storage:', error);
    throw error;
  }
};

export const getAllStorageKeys = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  } catch (error) {
    logger.error('Error getting storage keys:', error);
    return [];
  }
};