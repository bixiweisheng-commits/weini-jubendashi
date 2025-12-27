
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed tracking-tight active:scale-[0.98]";
  
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base"
  };

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/20",
    amber: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.2)] border border-amber-400/30",
    secondary: "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50",
    outline: "border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white bg-transparent",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2.5 opacity-80">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
