import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ReportCard = ({ 
  title, 
  description, 
  icon, 
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary/10 dark:bg-primary/20',
  metrics = [], 
  exportOptions = [], // New prop for multiple export options
  children 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${iconBgColor}`}>
              <Icon name={icon} size={24} className={iconColor} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary dark:text-white">{title}</h3>
              <p className="text-sm text-text-secondary dark:text-gray-400">{description}</p>
            </div>
          </div>

        </div>

        {metrics?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {metrics?.map((metric, index) => (
              <div key={index} className="bg-muted rounded-lg p-3 dark:bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-gray-400">{metric?.label}</span>
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
                <p className="text-xl font-mono font-semibold text-text-primary mt-1 dark:text-white">
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