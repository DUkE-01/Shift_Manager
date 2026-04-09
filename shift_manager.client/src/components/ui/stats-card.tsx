
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBg: string;
  iconColor: string;
  testId?: string;
}

export function StatsCard({ title, value, icon, iconBg, iconColor, testId }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-testid={testId}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBg}`}>
          <i className={`fas fa-${icon} ${iconColor} text-xl`}></i>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
