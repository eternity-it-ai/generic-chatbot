import { useMemo, useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { MessageSquare } from "lucide-react";
import type { BackendResponse, Message, Metadata } from "@/types";
import { arrayBufferToBase64 } from "@/utils/backend";
import { storage } from "@/utils/storage";
import SettingsSidebar from "@/components/SettingsSidebar";
import Header from "@/components/Header";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import LoadingIndicator from "@/components/LoadingIndicator";
import CenterLoading from "@/components/CenterLoading";
import DataHealthBox from "@/components/DataHealthBox";
import StatisticsCards from "@/components/StatisticsCards";

type Branding = {
  brandVersion?: number;
  welcomeName?: string;
  companyName?: string;
  companyDomain?: string;
  logoUrl?: string;
};

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    const remembered = storage.getRememberKey();
    return remembered ? storage.getApiKey() ?? "" : "";
  });
  const [model, setModel] = useState(() => storage.getModel());
  const [rememberKey, setRememberKey] = useState(() =>
    storage.getRememberKey()
  );

  const [branding, setBranding] = useState<Branding | null>(null);

  const [companyName, setCompanyName] = useState(() =>
    storage.getCompanyName()
  );
  const [companyUrl, setCompanyUrl] = useState(() => storage.getCompanyUrl());
  const [logoUrl, setLogoUrl] = useState<string | null>(() =>
    storage.getLogoUrl()
  );

  const [csvName, setCsvName] = useState<string>(() => storage.getCsvName());
  const [csvBase64, setCsvBase64] = useState<string>(() =>
    storage.getCsvBase64()
  );
  const [csvLoaded, setCsvLoaded] = useState(() => storage.getCsvLoaded());

  const [_status, setStatus] = useState<string>("");
  const [metadata, setMetadata] = useState<Metadata | null>(() =>
    storage.getMetadata<Metadata>()
  );
  const [query, setQuery] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>(() =>
    storage.getMessages<Message>()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAttemptedReload = useRef(false);

  // Generic call into Rust -> Python sidecar.
  const backendCall = useMemo(() => {
    return async (msg: Record<string, unknown>) => {
      const line = await invoke<string>("backend_call", {
        msgJson: JSON.stringify(msg),
      });

      const parsed = JSON.parse(line) as BackendResponse;
      if (!parsed.ok) throw new Error(parsed.error);
      return parsed.result;
    };
  }, []);

  // Fetch branding on mount
  useEffect(() => {
    (async () => {
      try {
        const b = await invoke<Branding | null>("get_branding");
        setBranding(b);
        if (b) {
          if (b.companyName) setCompanyName(b.companyName);
          if (b.companyDomain) {
            setCompanyUrl(b.companyDomain);
            // Derive logo from domain
            const cleanDomain = b.companyDomain
              .replace("https://", "")
              .replace("http://", "")
              .split("/")[0];
            setLogoUrl(
              `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
            );
          }
          // If logoUrl is explicitly provided, it overrides the derived one (optional, but good for flexibility)
          if (b.logoUrl) setLogoUrl(b.logoUrl);
        }
      } catch (e) {
        console.error("Failed to load branding:", e);
      }
    })();
  }, []);


  // Save to localStorage whenever values change
  useEffect(() => {
    if (rememberKey && apiKey) {
      storage.setApiKey(apiKey);
    } else if (!rememberKey) {
      storage.setApiKey(null);
    }
    storage.setRememberKey(rememberKey);
  }, [apiKey, rememberKey]);

  useEffect(() => {
    storage.setModel(model);
  }, [model]);

  useEffect(() => {
    storage.setCompanyName(companyName);
  }, [companyName]);

  useEffect(() => {
    storage.setCompanyUrl(companyUrl);
  }, [companyUrl]);

  useEffect(() => {
    storage.setLogoUrl(logoUrl);
  }, [logoUrl]);

  useEffect(() => {
    storage.setCsvName(csvName);
  }, [csvName]);

  useEffect(() => {
    storage.setCsvBase64(csvBase64);
  }, [csvBase64]);

  useEffect(() => {
    storage.setCsvLoaded(csvLoaded);
  }, [csvLoaded]);

  useEffect(() => {
    storage.setMetadata(metadata);
  }, [metadata]);

  useEffect(() => {
    storage.setMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-generate metadata when CSV is loaded and API key is available
  useEffect(() => {
    if (csvLoaded && apiKey && !metadata && !isLoading) {
      onGenerateMetadata();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvLoaded, apiKey]);

  // Auto-reload CSV to backend on mount if it exists in storage
  // Always reload because backend process is new each time app starts
  useEffect(() => {
    const loadStoredCsv = async () => {
      if (hasAttemptedReload.current) return;

      // If we have CSV data in storage, always reload it to backend
      // because the backend process is new and doesn't have the data
      if (csvBase64 && csvName) {
        hasAttemptedReload.current = true;
        setIsLoadingCsv(true);
        setLoadingMessage("Reloading CSV to backend...");
        try {
          const res = await backendCall({
            cmd: "load_csv",
            payload: { csv_base64: csvBase64 },
          });
          setCsvLoaded(true);
          setStatus(`CSV reloaded: ${res.rows} rows, ${res.cols} cols`);

          // Auto-generate metadata if API key is available and metadata exists
          // If metadata exists in storage, it means we had it before, so regenerate it
          if (apiKey && metadata) {
            // Metadata exists in storage, regenerate it to ensure backend has it
            setLoadingMessage("Regenerating metadata...");
            await onGenerateMetadata();
          } else if (apiKey && !metadata) {
            // No metadata, generate it
            await onGenerateMetadata();
          }
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setStatus(`Error reloading CSV: ${errorMessage}`);
          // Don't clear the state - user might want to retry
          setCsvLoaded(false);
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

  async function onFileSelect(file: File) {
    setCsvName(file.name);
    setMetadata(null);
    setMessages([]);
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
      const res = await backendCall({
        cmd: "load_csv",
        payload: { csv_base64: b64 },
      });

      setCsvLoaded(true);
      setStatus(`CSV loaded: ${res.rows} rows, ${res.cols} cols`);

      // Step 3: Auto-generate metadata if API key is available
      if (apiKey) {
        setLoadingMessage("Generating metadata (LLM call)...");
        const m = await backendCall({
          cmd: "generate_metadata",
          payload: { openai_api_key: apiKey, model },
        });
        setMetadata(m);
        setStatus("Metadata generated. You can now ask questions!");

        // Add welcome message
        const welcomeMessage: Message = {
          role: "assistant",
          content: `Hello! I've analyzed your data. Your dataset has a health score of ${
            m.health_score || 0
          }% and appears to be in the ${
            m.industry || "unknown"
          } industry. How can I help you analyze your data today?`,
        };
        setMessages([welcomeMessage]);
      } else {
        setStatus(
          "CSV loaded. Please enter your API key to generate metadata."
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoadingCsv(false);
    }
  }

  async function onGenerateMetadata() {
    if (!apiKey) {
      setStatus("Please enter an API key first.");
      return;
    }
    if (!csvBase64) {
      setStatus("Please load a CSV first.");
      return;
    }

    // Ensure CSV is loaded to backend first
    if (!csvLoaded) {
      setStatus("Loading CSV to backend first...");
      setIsLoadingCsv(true);
      setLoadingMessage("Loading CSV to backend...");
      try {
        await backendCall({
          cmd: "load_csv",
          payload: { csv_base64: csvBase64 },
        });
        setCsvLoaded(true);
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setStatus(`Error loading CSV: ${errorMessage}`);
        setIsLoadingCsv(false);
        return;
      }
    }

    setStatus("Generating metadata (LLM call)...");
    setIsLoadingCsv(true);
    setLoadingMessage("Generating metadata (LLM call)...");
    try {
      const m = await backendCall({
        cmd: "generate_metadata",
        payload: { openai_api_key: apiKey, model },
      });
      setMetadata(m);
      setStatus("Metadata generated. You can now ask questions!");

      // Add welcome message only if we don't have messages yet
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          role: "assistant",
          content: `Hello! I've analyzed your data. Your dataset has a health score of ${
            m.health_score || 0
          }% and appears to be in the ${
            m.industry || "unknown"
          } industry. How can I help you analyze your data today?`,
        };
        setMessages([welcomeMessage]);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoadingCsv(false);
    }
  }

  async function onRunAnalysis() {
    if (!apiKey) {
      setStatus("Please enter an API key first.");
      return;
    }
    if (!query.trim()) {
      setStatus("Please enter a question.");
      return;
    }
    if (!metadata) {
      setStatus("Please generate metadata first.");
      return;
    }

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");
    setIsLoading(true);

    try {
      const res = await backendCall({
        cmd: "run_analysis",
        payload: { openai_api_key: apiKey, model, query: currentQuery },
      });
      const assistantMessage: Message = {
        role: "assistant",
        content: String(res.answer ?? ""),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("");
    } catch (e: unknown) {
      const errorMessageText = e instanceof Error ? e.message : String(e);
      const errorMessage: Message = {
        role: "assistant",
        content: `I encountered an error: ${errorMessageText}. Please try rephrasing your question.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStatus(`Error: ${errorMessageText}`);
    } finally {
      setIsLoading(false);
    }
  }



  const handleNewChat = () => {
    setMessages([]);
    setQuery("");
    setStatus("");
  };

  const showChat = csvLoaded && metadata;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SettingsSidebar
        apiKey={apiKey}
        rememberKey={rememberKey}
        model={model}
        metadata={metadata}
        onApiKeyChange={setApiKey}
        onRememberKeyChange={setRememberKey}
        onModelChange={setModel}
      />

      {/* Main Content - Chat Interface */}
      <main className="w-full flex flex-col overflow-hidden h-screen ">
        {/* Header */}
        <Header
          companyName={companyName}
          logoUrl={logoUrl}
          companyUrl={companyUrl}
        />

        {/* Content Area */}
        <div className="h-[calc(100vh-72.5px)] overflow-scroll flex flex-col">
          {isLoadingCsv ? (
            /* Loading Screen - During CSV loading */
            <CenterLoading message={loadingMessage} />
          ) : !showChat ? (
            /* Welcome Screen - Before data is loaded */
            <div className="flex-1 overflow-y-auto">
              <WelcomeScreen 
                  onFileSelect={onFileSelect} 
                  welcomeName={branding?.welcomeName}
              />
            </div>
          ) : (
            /* Chat Interface - After data is loaded */
            <div className="flex-1 flex flex-col bg-gray-50">
              {/* Chat Header */}
              <ChatHeader onNewChat={handleNewChat} onNewFile={onFileSelect} />

              {/* Data Health */}
              <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 space-y-4 ">
                <DataHealthBox metadata={metadata!} />
                <StatisticsCards metadata={metadata!} />
              </div>

              {/* Chat Messages */}
              <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                <div className="max-w-4xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Start a conversation
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        Ask questions about your data to get insights and
                        analysis. Try asking about trends, patterns, or specific
                        metrics.
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => (
                        <ChatMessage key={idx} message={msg} />
                      ))}
                      {isLoading && <LoadingIndicator />}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Chat Input */}
              <div className="bg-white border-t border-gray-200">
                <div className="max-w-4xl mx-auto">
                  <ChatInput
                    value={query}
                    onChange={setQuery}
                    onSubmit={onRunAnalysis}
                    disabled={isLoading}
                    placeholder="Ask about strategy..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
