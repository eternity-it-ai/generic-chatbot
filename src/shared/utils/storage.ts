const STORAGE_KEYS = {
  API_KEY: "app_api_key",
  REMEMBER_KEY: "app_remember_key",
  MODEL: "app_model",
  COMPANY_NAME: "app_company_name",
  COMPANY_URL: "app_company_url",
  LOGO_URL: "app_logo_url",
  CSV_NAME: "app_csv_name",
  CSV_BASE64: "app_csv_base64",
  CSV_LOADED: "app_csv_loaded",
  METADATA: "app_metadata",
  MESSAGES: "app_messages",
} as const;

export function saveToStorage(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
}

export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage: ${key}`, error);
    return null;
  }
}

export function clearStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Failed to clear localStorage", error);
  }
}

export const storage = {
  // API Key
  getApiKey: (): string | null => loadFromStorage<string>(STORAGE_KEYS.API_KEY),
  setApiKey: (value: string | null): void =>
    saveToStorage(STORAGE_KEYS.API_KEY, value),
  
  // Remember Key
  getRememberKey: (): boolean =>
    loadFromStorage<boolean>(STORAGE_KEYS.REMEMBER_KEY) ?? false,
  setRememberKey: (value: boolean): void =>
    saveToStorage(STORAGE_KEYS.REMEMBER_KEY, value),
  
  // Model
  getModel: (): string => loadFromStorage<string>(STORAGE_KEYS.MODEL) ?? "gpt-4o",
  setModel: (value: string): void => saveToStorage(STORAGE_KEYS.MODEL, value),
  
  // Company
  getCompanyName: (): string =>
    loadFromStorage<string>(STORAGE_KEYS.COMPANY_NAME) ?? "Executive Intelligence",
  setCompanyName: (value: string): void =>
    saveToStorage(STORAGE_KEYS.COMPANY_NAME, value),
  
  getCompanyUrl: (): string =>
    loadFromStorage<string>(STORAGE_KEYS.COMPANY_URL) ?? "",
  setCompanyUrl: (value: string): void =>
    saveToStorage(STORAGE_KEYS.COMPANY_URL, value),
  
  getLogoUrl: (): string | null =>
    loadFromStorage<string>(STORAGE_KEYS.LOGO_URL),
  setLogoUrl: (value: string | null): void =>
    saveToStorage(STORAGE_KEYS.LOGO_URL, value),
  
  // CSV
  getCsvName: (): string => loadFromStorage<string>(STORAGE_KEYS.CSV_NAME) ?? "",
  setCsvName: (value: string): void => saveToStorage(STORAGE_KEYS.CSV_NAME, value),
  
  getCsvBase64: (): string => loadFromStorage<string>(STORAGE_KEYS.CSV_BASE64) ?? "",
  setCsvBase64: (value: string): void =>
    saveToStorage(STORAGE_KEYS.CSV_BASE64, value),
  
  getCsvLoaded: (): boolean =>
    loadFromStorage<boolean>(STORAGE_KEYS.CSV_LOADED) ?? false,
  setCsvLoaded: (value: boolean): void =>
    saveToStorage(STORAGE_KEYS.CSV_LOADED, value),
  
  // Metadata
  getMetadata: <T>(): T | null => loadFromStorage<T>(STORAGE_KEYS.METADATA),
  setMetadata: <T>(value: T | null): void =>
    saveToStorage(STORAGE_KEYS.METADATA, value),
  
  // Messages
  getMessages: <T>(): T[] => loadFromStorage<T[]>(STORAGE_KEYS.MESSAGES) ?? [],
  setMessages: <T>(value: T[]): void =>
    saveToStorage(STORAGE_KEYS.MESSAGES, value),
};
