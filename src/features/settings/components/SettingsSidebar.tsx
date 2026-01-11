import type { Metadata, Branding } from "@/shared/types";
import ModelSelect from "./ModelSelect";
import {
  ETERNITY_LOGO_URL,
  ETERNITY_COMPANY_NAME,
} from "@/features/branding/constants/branding";
import { Sparkles, Key, Brain, ChevronDown } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";

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
}

export default function SettingsSidebar({
  apiKey,
  rememberKey,
  model,
  metadata,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  branding,
  logoUrl,
}: SettingsSidebarProps) {
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
          {branding && (
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
          )}

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
                      await open(`https://eternity.ai/${path}`);
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
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
        </div>{" "}
        {/* Closes space-y-6 */}
      </div>{" "}
    </aside>
  );
}
