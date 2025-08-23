import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricsCard = ({ title, value, icon, color = 'primary', trend = null, description = null }) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    accent: 'bg-accent/10 text-accent'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-elevation-1 border border-slate-200 hover:shadow-elevation-2 transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-md ${colorClasses?.[color]}`}>
          <Icon name={icon} size={20} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-xs font-medium ${
            trend?.type === 'up' ? 'text-success' : trend?.type === 'down' ? 'text-destructive' : 'text-text-secondary'
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
        <p className="text-2xl font-mono font-semibold text-text-primary mb-1">
          {value}
        </p>
        <p className="text-sm text-text-secondary">{title}</p>
        {description && (
          <p className="text-xs text-text-secondary mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;