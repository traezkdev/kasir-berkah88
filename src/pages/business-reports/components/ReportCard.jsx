import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportCard = ({ 
  title, 
  description, 
  icon, 
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10',
  metrics = [], 
  onExport,
  exportLabel = 'Export',
  children 
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${iconBgColor}`}>
              <Icon name={icon} size={24} className={iconColor} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
              <p className="text-sm text-text-secondary">{description}</p>
            </div>
          </div>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              iconName="Download"
              iconPosition="left"
              className="shrink-0"
            >
              {exportLabel}
            </Button>
          )}
        </div>

        {metrics?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {metrics?.map((metric, index) => (
              <div key={index} className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{metric?.label}</span>
                  {metric?.trend && (
                    <div className={`flex items-center space-x-1 text-xs ${
                      metric?.trend === 'up' ? 'text-success' : 
                      metric?.trend === 'down' ? 'text-destructive' : 'text-text-secondary'
                    }`}>
                      <Icon 
                        name={metric?.trend === 'up' ? 'TrendingUp' : 
                              metric?.trend === 'down' ? 'TrendingDown' : 'Minus'} 
                        size={12} 
                      />
                      <span>{metric?.change}</span>
                    </div>
                  )}
                </div>
                <p className="text-xl font-mono font-semibold text-text-primary mt-1">
                  {metric?.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default ReportCard;