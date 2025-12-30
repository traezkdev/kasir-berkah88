import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QuickActionCard = ({ title, description, icon, route, color = 'primary', disabled = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!disabled && route) {
      navigate(route);
    }
  };

  const colorClasses = {
    primary: 'hover:border-primary',
    success: 'hover:border-success',
    accent: 'hover:border-accent',
    secondary: 'hover:border-secondary',
    destructive: 'hover:border-destructive'
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-elevation-2 ${colorClasses?.[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-md ${color === 'primary' ? 'bg-primary text-primary-foreground' :
            color === 'success' ? 'bg-success text-success-foreground' :
              color === 'accent' ? 'bg-accent text-accent-foreground' :
                color === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
          <Icon name={icon} size={20} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
      </div>
      <Button
        variant={color}
        size="sm"
        fullWidth
        iconName="ArrowRight"
        iconPosition="right"
        disabled={disabled}
        onClick={(e) => {
          e?.stopPropagation();
          handleClick();
        }}
      >
        Akses
      </Button>
    </div>
  );
};

export default QuickActionCard;