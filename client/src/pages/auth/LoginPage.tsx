import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { authApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { validatePhoneNumber } from '@/lib/utils';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login(phoneNumber);
      const { accessToken, refreshToken, userId } = response.data.data;

      // Store tokens and navigate to profile setup
      setTokens(accessToken, refreshToken);
      navigate('/profile/setup');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-telegram-bg flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-telegram-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-telegram-blue/5 rounded-full blur-3xl" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          {/* Logo and Title */}
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full gradient-telegram mb-4 sm:mb-6 shadow-lg shadow-telegram-blue/30">
              <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Telegram</h1>
            <p className="text-telegram-text-secondary text-sm sm:text-base">
              Sign in to start messaging
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="bg-telegram-bg-light/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-telegram-border/50">
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                error={error}
                disabled={isLoading}
              />

              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-telegram-text-secondary text-center">
                Enter your phone number to continue
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="w-5 h-5" />}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Security note */}
          <div className="mt-8 flex items-center justify-center gap-2 text-telegram-text-secondary">
            <Shield className="w-4 h-4" />
            <span className="text-sm">End-to-end encrypted</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 sm:py-6 px-4 text-center text-telegram-text-secondary text-xs sm:text-sm relative z-10">
        <p>
          By signing in, you agree to our{' '}
          <a href="#" className="text-telegram-blue hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-telegram-blue hover:underline">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
};
