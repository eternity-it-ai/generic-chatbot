import { useState, useEffect } from "react";
import type { Metadata, Branding } from "@/shared/types";
import ModelSelect from "./ModelSelect";
import {
  ETERNITY_LOGO_URL,
  ETERNITY_COMPANY_NAME,
} from "@/features/branding/constants/branding";
import {
  Sparkles,
  Key,
  Brain,
  ChevronDown,
  RefreshCw,
  Download,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { FieldError } from "@/shared/ui/field";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { getVersion } from "@tauri-apps/api/app";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";
import { showError, showInfo, showSuccess } from "@/shared/errors/toastService";

interface SettingsSidebarProps {
  apiKey: string;
  rememberKey: boolean;
  model: string;
  metadata: Metadata | null;
  onApiKeyChange: (key: string) => void;
  onRememberKeyChange: (remember: boolean) => void;
  onModelChange: (model: string) => void;
  branding: Branding | null;
  logoUrl: string | null;
  apiKeyError?: string | null;
}

export default function SettingsSidebar({
  apiKey,
  rememberKey,
  model,
  metadata,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  branding: _branding,
  logoUrl: _logoUrl,
  apiKeyError,
}: SettingsSidebarProps) {
  const URL_UPGRADES = "https://www.eternityglobalgroup.com/ai-agent";
  // Branding UI is currently disabled (see commented section below), but we keep
  // these props to avoid breaking callers.
  void _branding;
  void _logoUrl;
  const [appVersion, setAppVersion] = useState<string>("");
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [downloadProgressPercent, setDownloadProgressPercent] = useState<
    number | null
  >(null);
  const [fakeDownloadProgressPercent, setFakeDownloadProgressPercent] =
    useState<number | null>(null);
  const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getVersion()
      .then((v) => {
        if (!cancelled) setAppVersion(v);
      })
      .catch(() => {
        // Non-fatal; UI will just omit the version string.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // If the updater doesn't report a percent, we still show user-facing progress.
  useEffect(() => {
    if (!isDownloadingUpdate) {
      setFakeDownloadProgressPercent(null);
      return;
    }

    if (downloadProgressPercent !== null) {
      setFakeDownloadProgressPercent(null);
      return;
    }

    // Start with a visible amount and ease toward ~90%.
    setFakeDownloadProgressPercent((v) => (typeof v === "number" ? v : 5));

    const id = window.setInterval(() => {
      setFakeDownloadProgressPercent((prev) => {
        const current = typeof prev === "number" ? prev : 5;
        if (current >= 90) return 90;
        // Slow down as we approach 90
        const step = Math.max(0.5, (90 - current) / 18);
        return Math.min(90, current + step);
      });
    }, 250);

    return () => {
      window.clearInterval(id);
    };
  }, [isDownloadingUpdate, downloadProgressPercent]);

  const extractPercent = (progress: unknown): number | null => {
    if (typeof progress !== "object" || progress === null) return null;
    const record = progress as Record<string, unknown>;

    const clamp = (n: number) => Math.max(0, Math.min(100, n));

    if (typeof record.percent === "number" && Number.isFinite(record.percent)) {
      return clamp(record.percent);
    }

    if (
      typeof record.downloaded === "number" &&
      typeof record.total === "number" &&
      Number.isFinite(record.downloaded) &&
      Number.isFinite(record.total) &&
      record.total > 0
    ) {
      return clamp((record.downloaded / record.total) * 100);
    }

    if (typeof record.data === "object" && record.data !== null) {
      const data = record.data as Record<string, unknown>;
      if (
        typeof data.downloaded === "number" &&
        typeof data.total === "number" &&
        Number.isFinite(data.downloaded) &&
        Number.isFinite(data.total) &&
        data.total > 0
      ) {
        return clamp((data.downloaded / data.total) * 100);
      }
    }

    return null;
  };

  const handleCheckForUpdates = async () => {
    if (isCheckingUpdates || isDownloadingUpdate) return;
    setIsCheckingUpdates(true);
    setDownloadProgressPercent(null);
    setFakeDownloadProgressPercent(null);
    setIsUpdateDownloaded(false);
    try {
      const update = await check();
      setLastCheckedAt(new Date());
      setAvailableUpdate(update ?? null);

      if (update) {
        showInfo(`Update ${update.version} is available`, {
          title: "Update available",
        });
      } else {
        showSuccess("You’re up to date.", { title: "No updates" });
      }
    } catch (err) {
      setLastCheckedAt(new Date());
      setAvailableUpdate(null);
      showError(err, { title: "Update check failed" });
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleDownloadUpdate = async () => {
    if (
      !availableUpdate ||
      isCheckingUpdates ||
      isDownloadingUpdate ||
      isUpdateDownloaded
    )
      return;

    setIsDownloadingUpdate(true);
    setDownloadProgressPercent(null);
    setFakeDownloadProgressPercent(null);
    try {
      await availableUpdate.download((progress) => {
        const pct = extractPercent(progress);
        if (pct !== null) setDownloadProgressPercent(pct);
      });
      setIsUpdateDownloaded(true);
      showInfo("Installing update and restarting…", {
        title: "Installing update",
      });

      // Install immediately; updater will relaunch the app.
      await availableUpdate.install();
    } catch (err) {
      setIsUpdateDownloaded(false);
      showError(err, { title: "Update download failed" });
    } finally {
      setIsDownloadingUpdate(false);
    }
  };

  // Clear error when user starts typing
  const handleApiKeyChange = (key: string) => {
    onApiKeyChange(key);
  };
  return (
    <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      {/* Eternity Branding at Top - Sticky */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <img
            src={ETERNITY_LOGO_URL}
            alt="Eternity Logo"
            className="h-10 w-auto"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <h1 className="text-xl font-bold text-gray-800">
            {ETERNITY_COMPANY_NAME}
          </h1>
        </div>
      </div>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Client Branding - Dynamic */}
          {/* {branding && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Managed Instance
              </p>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={branding.payload.companyName}
                    className="h-8 w-8 rounded-md object-contain bg-white p-1 shadow-sm border border-gray-100"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {branding.payload.companyName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">
                    {branding.payload.companyName}
                  </p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">
                    {branding.payload.companyDomain}
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* Upgrades Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" /> Upgrades
            </h2>
            <div className="space-y-3">
              {["Dynamic role Agents", "Data integration", "Database MCP"].map(
                (feature) => (
                  <div
                    key={feature}
                    className="flex items-center cursor-pointer group"
                    onClick={async (e) => {
                      e.preventDefault(); // Prevent any default behavior
                      const path = feature.toLowerCase().replace(/ /g, "-");
                      await open(`${URL_UPGRADES}?feature=${path}`);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={false} // Always unchecked
                      readOnly // Make it read-only
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded pointer-events-none" // Disable pointer events on checkbox itself
                    />
                    <span
                      className="ml-2 block text-sm text-gray-700 pointer-events-none group-hover:text-blue-600 transition-colors" // Disable pointer events on label, adding visual feedback
                    >
                      {feature}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-gray-600" /> Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    apiKeyError
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  aria-invalid={!!apiKeyError}
                  aria-describedby={apiKeyError ? "api-key-error" : undefined}
                />
                {apiKeyError && (
                  <FieldError
                    id="api-key-error"
                    className="mt-1"
                    errors={[{ message: apiKeyError }]}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <ModelSelect value={model} onChange={onModelChange} />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-key"
                  checked={rememberKey}
                  onChange={(e) => onRememberKeyChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-key"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember API Key
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <details className="group">
              <summary className="cursor-pointer text-lg font-bold text-gray-800 mb-4 list-none">
                <span className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-gray-600" /> View Business
                    Logic
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </span>
              </summary>
              {metadata ? (
                <pre className="mt-4 p-4 bg-gray-50 rounded-md text-xs overflow-auto max-h-96">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Upload data to generate logic.
                </p>
              )}
            </details>
          </div>

          {/* Updates */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <RefreshCw className="w-5 h-5 mr-2 text-gray-600" /> Updates
            </h2>
            <div className="space-y-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium">Current version:</span>{" "}
                <span className="font-mono">{appVersion || "—"}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingUpdates || isDownloadingUpdate}
                >
                  {isCheckingUpdates ? "Checking…" : "Check for updates"}
                </Button>

                {availableUpdate && (
                  <div className="rounded-md border border-gray-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Update available:{" "}
                          <span className="font-mono">
                            {availableUpdate.version}
                          </span>
                        </p>
                        {availableUpdate.body && (
                          <p className="mt-1 text-xs text-gray-600 whitespace-pre-wrap">
                            {availableUpdate.body}
                          </p>
                        )}
                      </div>
                      <Download className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                    </div>

                    <div className="mt-3 space-y-2">
                      {!isUpdateDownloaded ? (
                        <Button
                          type="button"
                          onClick={handleDownloadUpdate}
                          disabled={
                            isCheckingUpdates ||
                            isDownloadingUpdate ||
                            isUpdateDownloaded
                          }
                        >
                          {isDownloadingUpdate
                            ? "Downloading…"
                            : "Download and restart"}
                        </Button>
                      ) : (
                        <Button type="button" disabled>
                          Installing… (app will restart)
                        </Button>
                      )}

                      {(isDownloadingUpdate ||
                        downloadProgressPercent !== null ||
                        fakeDownloadProgressPercent !== null) && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Downloading</span>
                            <span>
                              {downloadProgressPercent !== null
                                ? `${Math.round(downloadProgressPercent)}%`
                                : fakeDownloadProgressPercent !== null
                                ? `${Math.round(fakeDownloadProgressPercent)}%`
                                : "—"}
                            </span>
                          </div>
                          <Progress
                            value={
                              downloadProgressPercent ??
                              fakeDownloadProgressPercent ??
                              0
                            }
                          />
                        </div>
                      )}

                      {isUpdateDownloaded && (
                        <p className="text-xs text-gray-500">
                          Installing the update now. The app will relaunch
                          automatically.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!availableUpdate &&
                  lastCheckedAt &&
                  !isCheckingUpdates &&
                  !isDownloadingUpdate && (
                    <p className="text-xs text-gray-500">
                      Last checked: {lastCheckedAt.toLocaleString()}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Closes space-y-6 */}
      </div>{" "}
    </aside>
  );
}
