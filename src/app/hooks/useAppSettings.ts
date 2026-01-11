import { useState } from "react";
import { storage } from "@/shared/utils/storage";

export function useAppSettings() {
  const [apiKey, setApiKey] = useState(() => {
    const remembered = storage.getRememberKey();
    return remembered ? storage.getApiKey() ?? "" : "";
  });
  const [model, setModel] = useState(() => storage.getModel());
  const [rememberKey, setRememberKey] = useState(() =>
    storage.getRememberKey()
  );

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    rememberKey,
    setRememberKey,
  };
}
