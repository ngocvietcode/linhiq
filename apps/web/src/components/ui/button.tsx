import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    let variantStyles = '';
    
    switch (variant) {
      case 'primary':
        variantStyles = 'bg-accent text-white border-transparent hover:bg-[#7b7ef5] active:scale-[0.96]';
        break;
      case 'secondary':
        variantStyles = 'bg-transparent border border-border-default text-text-secondary hover:border-accent hover:text-text-primary';
        break;
      case 'ghost':
        variantStyles = 'bg-transparent border-transparent text-text-secondary hover:text-text-primary';
        break;
      case 'danger':
        variantStyles = 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'sm':
        sizeStyles = 'px-3 py-1.5 text-sm rounded-md';
        break;
      case 'md':
        sizeStyles = 'px-5 py-3 text-[15px] rounded-[10px]';
        break;
      case 'lg':
        sizeStyles = 'px-8 py-4 text-lg rounded-xl';
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
