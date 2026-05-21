import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBERED_AT_KEY = 'stitch-noir-remembered-at';
const REMEMBER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type RememberedSessionStatus = 'missing' | 'valid' | 'expired';

async function readRememberedAt() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    return window.localStorage.getItem(REMEMBERED_AT_KEY);
  }

  return AsyncStorage.getItem(REMEMBERED_AT_KEY);
}

async function writeRememberedAt(value: string) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(REMEMBERED_AT_KEY, value);
    return;
  }

  await AsyncStorage.setItem(REMEMBERED_AT_KEY, value);
}

async function removeRememberedAt() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.removeItem(REMEMBERED_AT_KEY);
    return;
  }

  await AsyncStorage.removeItem(REMEMBERED_AT_KEY);
}

export async function markSessionRemembered() {
  await writeRememberedAt(new Date().toISOString());
}

export async function clearRememberedSession() {
  await removeRememberedAt();
}

export async function isRememberedSessionValid() {
  return (await getRememberedSessionStatus()) === 'valid';
}

export async function getRememberedSessionStatus(): Promise<RememberedSessionStatus> {
  const rememberedAt = await readRememberedAt();

  if (!rememberedAt) {
    return 'missing';
  }

  const rememberedAtMs = Date.parse(rememberedAt);
  if (Number.isNaN(rememberedAtMs)) {
    await removeRememberedAt();
    return 'missing';
  }

  return Date.now() - rememberedAtMs <= REMEMBER_WINDOW_MS ? 'valid' : 'expired';
}
