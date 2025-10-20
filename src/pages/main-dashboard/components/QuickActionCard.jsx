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
    primary: 'from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30',
    success: 'from-success/10 to-success/5 border-success/20 hover:border-success/30',
    accent: 'from-accent/10 to-accent/5 border-accent/20 hover:border-accent/30',
    secondary: 'from-secondary/10 to-secondary/5 border-secondary/20 hover:border-secondary/30',
    destructive: 'from-destructive/10 to-destructive/5 border-destructive/20 hover:border-destructive/30'
  };

  return (
    <div 
      className={`bg-gradient-to-br ${colorClasses?.[color]} rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer hover:shadow-elevation-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3 mb-3">
        <div className={`p-2 rounded-md ${
          color === 'primary' ? 'bg-primary text-white' :
          color === 'success' ? 'bg-success text-white' :
          color === 'accent'? 'bg-accent text-white' :
          color === 'destructive'? 'bg-destructive text-white' : 'bg-secondary text-white'
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