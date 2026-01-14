import React, { useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-brand-400 text-white hover:bg-brand-500 shadow-sm",
    secondary: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    outline: "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
    ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>}
      <input
        className={`flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// --- Select (Simple Wrapper) ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
}

export const Select: React.FC<SelectProps> = ({ label, className = '', children, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>}
            <div className="relative">
                <select
                    className={`flex h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${className}`}
                    {...props}
                >
                    {children}
                </select>
                {/* Chevron icon could be added here absolutely positioned */}
            </div>
        </div>
    );
};

// --- Card ---
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-3xl border border-stone-100 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
};

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'success' | 'warning' }> = ({ children, variant = 'default' }) => {
    const variants = {
        default: "bg-stone-100 text-stone-800",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800"
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

// --- Modal ---
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-lg transform rounded-3xl bg-white p-6 shadow-2xl transition-all animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-stone-900">{title}</h3>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-stone-100 text-stone-500">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};