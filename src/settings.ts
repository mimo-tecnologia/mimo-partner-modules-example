import type { PartnerModule } from './partner-api';

const STORAGE_KEY = 'partner-iframe-test:settings';

export interface Settings {
  baseUrl: string;
  apiKey: string;
  partnerId: string;
  document: string;
  moduleId: PartnerModule;
}

const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'https://mimo-partner-api-222552461205.us-central1.run.app',
  apiKey: '',
  partnerId: '',
  document: '',
  moduleId: 'chef',
};

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
