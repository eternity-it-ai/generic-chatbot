import { useState, useEffect, useRef } from "react";
import { arrayBufferToBase64 } from "@/shared/utils/backend";
import type { Metadata, Message } from "@/shared/types";
import { storage } from "@/shared/utils/storage";
import { showAppError } from "@/shared/errors/toastService";
import { toAppError, ErrorCode } from "@/shared/errors/errorUtils";

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
    try {
      const res = await backendCall({
        cmd: "load_csv",
        payload: { csv_base64: base64 },
      });
      setCsvLoaded(true);
      const result = res as { rows: number; cols: number };
      return result;
    } catch (error) {
      const appError = toAppError(error, { command: "load_csv" });
      showAppError(appError);
      throw appError;
    }
  };

  const generateMetadata = async (base64?: string) => {
    if (!apiKey) {
      const error = toAppError(new Error("Please enter an API key first."), {
        code: ErrorCode.MISSING_API_KEY,
      });
      showAppError(error);
      throw error;
    }

    // Use provided base64 parameter or fall back to state
    const csvData = base64 || csvBase64;

    if (!csvData) {
      const error = toAppError(new Error("Please load a CSV first."), {
        code: ErrorCode.MISSING_CSV,
      });
      showAppError(error);
      throw error;
    }

    try {
      // Ensure CSV is loaded to backend first
      // If base64 parameter is provided, we know it was just loaded in onFileSelect, so skip reload
      if (!base64 && !csvLoaded) {
        setLoadingMessage("Loading CSV to backend...");
        await loadCsvToBackend(csvData);
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
    } catch (error) {
      const appError = toAppError(error, { command: "generate_metadata" });
      showAppError(appError);
      throw appError;
    }
  };

  const onFileSelect = async (file: File) => {
    setCsvName(file.name);
    onMetadataGenerated(null);
    onMessagesSet([]);
    setCsvLoaded(false);
    setIsLoadingCsv(true);
    setLoadingMessage("Reading CSV file...");

    try {
      // Frontend validation: Check file type
      if (!file.name.toLowerCase().endsWith(".csv")) {
        const error = toAppError(
          new Error("Invalid file type. Please select a CSV file."),
          { code: ErrorCode.INVALID_FILE_TYPE, file: file.name }
        );
        showAppError(error);
        setIsLoadingCsv(false);
        setLoadingMessage("");
        throw error;
      }

      // Frontend validation: Check file size (e.g., 50MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        const error = toAppError(
          new Error(
            `File is too large (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB). Maximum size is 50MB.`
          ),
          { code: ErrorCode.FILE_TOO_LARGE, fileSize: file.size }
        );
        showAppError(error);
        setIsLoadingCsv(false);
        setLoadingMessage("");
        throw error;
      }

      // Step 1: Read file
      let buf: ArrayBuffer;
      try {
        buf = await file.arrayBuffer();
      } catch (readError) {
        const error = toAppError(
          new Error(
            "Failed to read file. Please try selecting the file again."
          ),
          { code: ErrorCode.FILE_READ_ERROR, originalError: readError }
        );
        showAppError(error);
        setIsLoadingCsv(false);
        setLoadingMessage("");
        throw error;
      }

      let b64: string;
      try {
        b64 = arrayBufferToBase64(buf);
      } catch (convertError) {
        const error = toAppError(
          new Error("Failed to process file. Please try again."),
          { code: ErrorCode.FILE_READ_ERROR, originalError: convertError }
        );
        showAppError(error);
        setIsLoadingCsv(false);
        setLoadingMessage("");
        throw error;
      }

      setCsvBase64(b64);

      // Step 2: Automatically load to backend
      setLoadingMessage("Loading CSV to backend...");
      await loadCsvToBackend(b64);

      // Step 3: Auto-generate metadata if API key is available
      if (apiKey) {
        setLoadingMessage("Generating metadata (LLM call)...");
        await generateMetadata(b64);
      }
      setLoadingMessage("");
    } catch (err: unknown) {
      // Error already handled above or in called functions
      const appError = toAppError(err, {
        command: "onFileSelect",
        fileName: file.name,
      });
      // Only show error if it hasn't been shown already
      if (!(err instanceof Error && "code" in err)) {
        showAppError(appError);
      }
      setIsLoadingCsv(false);
      setLoadingMessage("");
      throw appError;
    } finally {
      setIsLoadingCsv(false);
    }
  };

  const onGenerateMetadata = async () => {
    setIsLoadingCsv(true);
    try {
      await generateMetadata();
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

          // Restore cached metadata (avoid re-generating on every restart/update)
          const existingMetadata = storage.getMetadata<Metadata>();
          if (existingMetadata) {
            setLoadingMessage("Restoring metadata...");
            onMetadataGenerated(existingMetadata);
            try {
              // Rehydrate backend state so chat/analysis works immediately
              await backendCall({
                cmd: "set_metadata",
                payload: { metadata: existingMetadata },
              });
            } catch {
              // If this fails, the automatic retry in `useBackend` can still recover later.
            }
          } else if (apiKey) {
            // No cached metadata -> generate once (LLM call)
            await generateMetadata();
          }
        } catch (e: unknown) {
          const appError = toAppError(e, { command: "loadStoredCsv" });
          setCsvLoaded(false);
          // Only show toast for non-silent errors (user-initiated actions)
          // Silent reload errors are logged but not shown to avoid noise
          console.error("Error reloading CSV:", appError.message);
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
