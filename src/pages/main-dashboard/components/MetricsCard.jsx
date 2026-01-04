import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, icon, color = 'primary', trend = null, description = null }) => {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-indigo-400 to-purple-600',
    success: 'bg-gradient-to-br from-green-400 to-teal-600',
    warning: 'bg-gradient-to-br from-amber-400 to-orange-600',
    accent: 'bg-gradient-to-br from-pink-500 to-rose-500',
    info: 'bg-gradient-to-br from-sky-400 to-blue-600',
    destructive: 'bg-gradient-to-br from-red-500 to-red-700',
  };

  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent',
    info: 'bg-sky-500/10 text-sky-500',
    destructive: 'bg-red-500/10 text-red-500',
  };

  const gradient = gradientClasses[color] || gradientClasses.primary;
  const iconColors = colorClasses[color] || colorClasses.primary;

  // Dynamic font scaling for value
  const valStr = String(value);
  const len = valStr.length;

  let fontSizeClass = 'text-2xl';
  if (len > 22) fontSizeClass = 'text-sm';
  else if (len > 18) fontSizeClass = 'text-base';
  else if (len > 14) fontSizeClass = 'text-lg';
  else if (len > 11) fontSizeClass = 'text-xl';

  return (
    <div className={`${gradient} rounded-lg p-0.5 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out`}>
      <div className="bg-card rounded-md p-4 h-full">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-md ${iconColors}`}>
            <Icon name={icon} size={20} />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${trend?.type === 'up' ? 'text-success' : trend?.type === 'down' ? 'text-destructive' : 'text-text-secondary'
              }`}>
              <Icon
                name={trend?.type === 'up' ? 'TrendingUp' : trend?.type === 'down' ? 'TrendingDown' : 'Minus'}
                size={12}
              />
              <span>{trend?.value}</span>
            </div>
          )}
        </div>
        <div>
          <p className={`${fontSizeClass} font-mono font-semibold text-text-primary mb-1 whitespace-nowrap transition-all`}>
            {value}
          </p>
          <p className="text-sm text-text-secondary">{title}</p>
          {description && (
            <p className="text-xs text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;