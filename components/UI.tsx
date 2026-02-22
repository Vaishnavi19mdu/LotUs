
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = "",
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full focus:outline-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-rose text-white hover:bg-opacity-90 shadow-sm",
    secondary: "bg-charcoal text-cream hover:bg-opacity-90",
    outline: "border-2 border-rose text-rose hover:bg-rose hover:text-white",
    ghost: "text-rose hover:bg-rose hover:bg-opacity-10",
  };
  
  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const BackButton: React.FC<{ to?: string; className?: string }> = ({ to, className = "" }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ x: -4 }}
      onClick={() => to ? navigate(to) : navigate(-1)}
      className={`group flex items-center gap-2 text-gray-400 hover:text-rose transition-colors duration-300 z-50 ${className}`}
    >
      <div className="p-2 rounded-full border border-gray-800 group-hover:border-rose/30 transition-colors">
        <ArrowLeft size={18} />
      </div>
      <span className="text-sm font-bold uppercase tracking-widest">Back</span>
    </motion.button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; dark?: boolean }> = ({ children, className = "", dark = false }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 300 }}
    className={`${dark ? 'bg-charcoal text-cream border border-gray-800' : 'bg-cream text-charcoal'} rounded-2xl p-6 shadow-sm ${className}`}
  >
    {children}
  </motion.div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input 
    className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose focus:border-transparent outline-none transition-all text-charcoal placeholder:text-gray-400 ${className}`}
    {...props}
  />
);

export const Badge: React.FC<{ children: React.ReactNode; variant?: 'rose' | 'neutral' }> = ({ children, variant = 'neutral' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variant === 'rose' ? 'bg-rose bg-opacity-10 text-rose' : 'bg-gray-100 text-gray-600'}`}>
    {children}
  </span>
);
