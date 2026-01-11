

interface MetricsCardsProps {
  revenue: number;
  volume: number;
  avgValue: number;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toLocaleString();
}

export default function MetricsCards({
  revenue,
  volume,
  avgValue,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border-t-4 border-blue-500 p-6 text-center hover:shadow-lg transition-shadow">
        <div className="text-sm font-medium text-gray-700 mb-2">Revenue</div>
        <div className="text-3xl font-extrabold text-blue-700 mb-1">
          {formatCurrency(revenue)}
        </div>
        <div className="text-xs text-gray-500">
          {revenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border-t-4 border-green-500 p-6 text-center hover:shadow-lg transition-shadow">
        <div className="text-sm font-medium text-gray-700 mb-2">Volume</div>
        <div className="text-3xl font-extrabold text-green-700 mb-1">
          {formatNumber(volume)}
        </div>
        <div className="text-xs text-gray-500">transactions</div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border-t-4 border-purple-500 p-6 text-center hover:shadow-lg transition-shadow">
        <div className="text-sm font-medium text-gray-700 mb-2">Avg Value</div>
        <div className="text-3xl font-extrabold text-purple-700 mb-1">
          {formatCurrency(avgValue)}
        </div>
        <div className="text-xs text-gray-500">per transaction</div>
      </div>
    </div>
  );
}
