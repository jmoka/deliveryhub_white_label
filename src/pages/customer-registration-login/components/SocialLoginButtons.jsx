import React from 'react';
import Button from '../../../components/ui/Button';


const SocialLoginButtons = ({ 
  onGoogleLogin = () => {},
  onFacebookLogin = () => {},
  loading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        variant="outline"
        fullWidth
        onClick={onGoogleLogin}
        disabled={loading}
        iconName="Chrome"
        iconPosition="left"
        className="h-12 border-2 hover:bg-gray-50 transition-all duration-200"
      >
        <span className="font-medium">Continuar com Google</span>
      </Button>

      <Button
        variant="outline"
        fullWidth
        onClick={onFacebookLogin}
        disabled={loading}
        iconName="Facebook"
        iconPosition="left"
        className="h-12 border-2 hover:bg-blue-50 transition-all duration-200"
      >
        <span className="font-medium">Continuar com Facebook</span>
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">ou</span>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginButtons;