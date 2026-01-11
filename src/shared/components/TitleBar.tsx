import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Square, X, Layers, Minus, ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface TitleBarProps {
  companyName?: string;
  logoUrl?: string | null;
  onSignOut?: () => void;
}

export default function TitleBar({ companyName, logoUrl, onSignOut }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [platform, setPlatform] = useState<string>("windows");
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const init = async () => {
      try {
        const p = await invoke<string>("get_platform");
        setPlatform(p.toLowerCase());
        setIsMaximized(await appWindow.isMaximized());
      } catch (e) {
        console.error("Failed to init titlebar:", e);
      }
    };

    init();

    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [appWindow]);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = async () => {
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };
  const handleClose = () => appWindow.close();

  const isMac = platform === "macos" || platform === "darwin";

  const handleSignOutClick = () => {
    setShowSignOutDialog(true);
  };

  const handleSignOutConfirm = () => {
    setShowSignOutDialog(false);
    onSignOut?.();
  };

  const renderBranding = () => {
    const displayName = companyName || "Eternity AI";
    
    if (!companyName || !onSignOut) {
      // If no company name or no sign out handler, render as before
      return (
        <div className="flex items-center gap-2 pointer-events-none" data-tauri-drag-region>
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {displayName}
            </span>
            {companyName && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tighter">
                Enterprise
              </span>
            )}
          </div>
        </div>
      );
    }

    // Render with dropdown
    return (
      <div className="flex items-center gap-2" data-tauri-drag-region>
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="w-5 h-5 object-contain pointer-events-none" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-1 transition-colors pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {displayName}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-tighter">
                  Enterprise
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem
              onClick={handleSignOutClick}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div
      data-tauri-drag-region
      className={`h-10 bg-white border-b border-gray-200 flex items-center select-none fixed top-0 left-0 right-0 z-[100] ${
        isMac ? "flex-row-reverse" : "flex-row"
      } justify-between`}
    >
      {/* Platform specific controls */}
      {isMac ? (
        <div className="flex items-center px-4 gap-2 group">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center transition-colors"
          >
            <X className="w-2 h-2 text-black/40 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center transition-colors"
          >
            <Minus className="w-2 h-2 text-black/40 opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center transition-colors"
          >
            <div className="w-1.5 h-1.5 border-[0.5px] border-black/40 opacity-0 group-hover:opacity-100" />
          </button>
        </div>
      ) : (
        <div className="flex items-center px-4" data-tauri-drag-region>
           {renderBranding()}
        </div>
      )}

      {/* Center title area (for dragging on Windows or Title on Mac) */}
      {isMac ? (
        <div className="flex-1 flex justify-center items-center pointer-events-none" data-tauri-drag-region>
           {renderBranding()}
        </div>
      ) : (
        <div data-tauri-drag-region className="flex-1 h-full" />
      )}

      {/* Windows controls */}
      {!isMac && (
        <div className="flex h-full">
          <button
            onClick={handleMinimize}
            className="px-4 h-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500"
            title="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="px-4 h-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-500"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Layers className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 h-full hover:bg-[#e81123] hover:text-white transition-colors flex items-center justify-center text-gray-500"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Spacer for Mac right side */}
      {isMac && <div className="w-20" />}

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out from{" "}
              <strong>{companyName || "this account"}</strong>? This will reset
              the application setup and clear all branding and configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
