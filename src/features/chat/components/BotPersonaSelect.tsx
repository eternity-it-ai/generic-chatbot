import { BarChart3, Briefcase, ChevronDown, Crown, Sparkles } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import type { BotId } from "@/shared/types";
import { BOT_DEFINITIONS, BOT_IDS } from "@/shared/constants/bots";

interface BotPersonaSelectProps {
  botId: BotId;
  disabled: boolean;
  onBotChange: (botId: BotId) => void;
}

function BotPersonaSelect({ botId, disabled, onBotChange }: BotPersonaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: BotId) => {
    onBotChange(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={BOT_DEFINITIONS[botId].label}
        className="h-9 w-fit px-3 shrink-0 rounded-lg bg-transparent border-0 hover:bg-gray-100 focus-visible:ring-0 justify-center transition-colors flex items-center disabled:opacity-50 gap-2 "
      >
        {BOT_DEFINITIONS[botId].icon === "briefcase" ? (
          <Briefcase className="h-4 w-4 text-gray-600" />
        ) : (
          <BarChart3 className="h-4 w-4 text-gray-600" />
        )}
        <span className="text-sm font-medium text-gray-800">
          {BOT_DEFINITIONS[botId].label}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-600 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="pb-2 mb-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-900 px-2 py-1.5">
              Available Models
            </p>
          </div>

          {BOT_IDS.map((id) => (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              className="w-full rounded-lg px-3 py-2.5 mb-1 cursor-pointer hover:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-3">
                  {BOT_DEFINITIONS[id].icon === "briefcase" ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">
                      {BOT_DEFINITIONS[id].label}
                    </span>
                    <span className="text-xs text-gray-500">Fast and efficient</span>
                  </div>
                </span>
                {botId === id && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
              </div>
            </button>
          ))}

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-900 px-2 py-1.5 mb-2">
              Premium Models
            </p>

            <div className="rounded-lg px-3 py-2.5 mb-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 cursor-not-allowed opacity-75">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">
                      Advanced Analyst
                    </span>
                    <span className="text-xs text-gray-500">Deep reasoning & analysis</span>
                  </div>
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                  UPGRADE
                </span>
              </div>
            </div>

            <div className="rounded-lg px-3 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 cursor-not-allowed opacity-75">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">
                      Creative Expert
                    </span>
                    <span className="text-xs text-gray-500">Enhanced creativity & writing</span>
                  </div>
                </span>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm">
                  UPGRADE
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(BotPersonaSelect);

