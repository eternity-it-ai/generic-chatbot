import { useState, useEffect, useRef } from "react";
import { arrayBufferToBase64 } from "@/shared/utils/backend";
import type { Metadata, Message } from "@/shared/types";
import { storage } from "@/shared/utils/storage";

interface UseFileManagementProps {
  apiKey: string;
  model: string;
  backendCall: (msg: Record<string, unknown>) => Promise<unknown>;
  onMetadataGenerated: (metadata: Metadata | null) => void;
  onMessagesSet: (messages: Message[]) => void;
}

export function useFileManagement({
  apiKey,
  model,
  backendCall,
  onMetadataGenerated,
  onMessagesSet,
}: UseFileManagementProps) {
  const [csvName, setCsvName] = useState<string>(() => storage.getCsvName());
  const [csvBase64, setCsvBase64] = useState<string>(() =>
    storage.getCsvBase64()
  );
  const [csvLoaded, setCsvLoaded] = useState(() => storage.getCsvLoaded());
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const hasAttemptedReload = useRef(false);

  const loadCsvToBackend = async (base64: string) => {
    const res = await backendCall({
      cmd: "load_csv",
      payload: { csv_base64: base64 },
    });
    setCsvLoaded(true);
    return res as { rows: number; cols: number };
  };

  const generateMetadata = async () => {
    if (!apiKey) {
      throw new Error("Please enter an API key first.");
    }
    if (!csvBase64) {
      throw new Error("Please load a CSV first.");
    }

    // Ensure CSV is loaded to backend first
    if (!csvLoaded) {
      setLoadingMessage("Loading CSV to backend...");
      await loadCsvToBackend(csvBase64);
    }

    setLoadingMessage("Generating metadata (LLM call)...");
    const m = await backendCall({
      cmd: "generate_metadata",
      payload: { openai_api_key: apiKey, model },
    });

    const metadata = m as Metadata;
    onMetadataGenerated(metadata);

    // Add welcome message only if we don't have messages yet
    const welcomeMessage: Message = {
      role: "assistant",
      content: `Hello! I've analyzed your data. Your dataset has a health score of ${
        metadata.health_score || 0
      }% and appears to be in the ${
        metadata.industry || "unknown"
      } industry. How can I help you analyze your data today?`,
    };
    onMessagesSet([welcomeMessage]);

    return metadata;
  };

  const onFileSelect = async (file: File) => {
    setCsvName(file.name);
    onMetadataGenerated(null);
    onMessagesSet([]);
    setCsvLoaded(false);
    setIsLoadingCsv(true);
    setLoadingMessage("Reading CSV file...");

    try {
      // Step 1: Read file
      const buf = await file.arrayBuffer();
      const b64 = arrayBufferToBase64(buf);
      setCsvBase64(b64);

      // Step 2: Automatically load to backend
      setLoadingMessage("Loading CSV to backend...");
      await loadCsvToBackend(b64);

      // Step 3: Auto-generate metadata if API key is available
      if (apiKey) {
        setLoadingMessage("Generating metadata (LLM call)...");
        await generateMetadata();
      }
      setLoadingMessage("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setLoadingMessage(`Error: ${errorMessage}`);
      setIsLoadingCsv(false);
      throw err;
    } finally {
      setIsLoadingCsv(false);
    }
  };

  const onGenerateMetadata = async () => {
    setIsLoadingCsv(true);
    try {
      await generateMetadata();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(errorMessage);
    } finally {
      setIsLoadingCsv(false);
    }
  };

  // Auto-reload CSV to backend on mount if it exists in storage
  useEffect(() => {
    const loadStoredCsv = async () => {
      if (hasAttemptedReload.current) return;

      if (csvBase64 && csvName) {
        hasAttemptedReload.current = true;
        setIsLoadingCsv(true);
        setLoadingMessage("Reloading CSV to backend...");
        try {
          await loadCsvToBackend(csvBase64);

          // Auto-generate metadata if API key is available
          const existingMetadata = storage.getMetadata<Metadata>();
          if (apiKey && existingMetadata) {
            setLoadingMessage("Regenerating metadata...");
            onMetadataGenerated(existingMetadata);
            await generateMetadata();
          } else if (apiKey && !existingMetadata) {
            await generateMetadata();
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setCsvLoaded(false);
          console.error("Error reloading CSV:", errorMessage);
        } finally {
          setIsLoadingCsv(false);
        }
      } else {
        hasAttemptedReload.current = true;
      }
    };

    loadStoredCsv();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    csvName,
    csvBase64,
    csvLoaded,
    isLoadingCsv,
    loadingMessage,
    onFileSelect,
    onGenerateMetadata,
  };
}
