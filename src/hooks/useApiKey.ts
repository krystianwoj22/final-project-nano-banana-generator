import { useState, useEffect, useCallback } from 'react';

const API_KEY_STORAGE_KEY = 'nano_banana_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');

  const syncKey = useCallback(() => {
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    setApiKeyState(storedKey || '');
  }, []);

  useEffect(() => {
    syncKey();
    window.addEventListener('storage', syncKey);
    window.addEventListener('nano_banana_api_key_changed', syncKey);
    return () => {
      window.removeEventListener('storage', syncKey);
      window.removeEventListener('nano_banana_api_key_changed', syncKey);
    };
  }, [syncKey]);

  const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKeyState(key);
    window.dispatchEvent(new Event('nano_banana_api_key_changed'));
  };

  const removeApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKeyState('');
    window.dispatchEvent(new Event('nano_banana_api_key_changed'));
  };

  return { apiKey, saveApiKey, removeApiKey, hasApiKey: !!apiKey };
}
