
import type { Metadata } from "@/shared/types";

interface StatisticsCardsProps {
  metadata: Metadata;
}

export default function StatisticsCards({ metadata }: StatisticsCardsProps) {
  const statistics = metadata.statistics || [];

  if (statistics.length === 0) {
    return null;
  }

  const formatValue = (value: number, isPercentage?: boolean): string => {
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    // Format large numbers with commas
    if (value >= 1000) {
      return value.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      });
    }
    return value.toFixed(2);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {statistics.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-600 mb-2">
              {stat.label}
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatValue(stat.value, stat.is_percentage)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
