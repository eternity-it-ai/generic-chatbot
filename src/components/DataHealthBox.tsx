import type { Metadata } from "@/types";

interface DataHealthBoxProps {
  metadata: Metadata;
}

export default function DataHealthBox({ metadata }: DataHealthBoxProps) {
  const healthScore = metadata.health_score || 0;

  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                Data Readiness Score
              </span>
              <span className="text-lg font-bold text-gray-800">
                {healthScore}%
              </span>
            </div>
            <div className="h-3 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                Industry
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {metadata.industry || "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
