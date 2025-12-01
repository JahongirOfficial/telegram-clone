import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User, AtSign, FileText, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  username: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/, 'Username must be 5-32 characters, start with a letter')
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, 'Bio is too long').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      username: '',
      bio: '',
    },
  });

  const watchedName = watch('name');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      const response = await userApi.createProfile({
        name: data.name,
        username: data.username || undefined,
        bio: data.bio || undefined,
      });

      setUser(response.data.data);
      navigate('/');
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-telegram-bg flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-telegram-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-telegram-blue/5 rounded-full blur-3xl" />
      </div>

      {/* Progress indicator */}
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                s === step ? 'w-8 bg-telegram-blue' : 'w-4 bg-telegram-bg-light',
                s < step && 'bg-telegram-green'
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          {step === 1 ? (
            // Step 1: Name and Photo
            <>
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Set Up Your Profile
                </h1>
                <p className="text-telegram-text-secondary text-sm sm:text-base">
                  Add your name and photo
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  <label className="relative cursor-pointer group">
                    <div
                      className={cn(
                        'w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center',
                        'bg-gradient-to-br from-telegram-blue to-telegram-blue-dark',
                        'transition-transform group-hover:scale-105',
                        'shadow-lg shadow-telegram-blue/30'
                      )}
                    >
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : watchedName ? (
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          {getInitials(watchedName)}
                        </span>
                      ) : (
                        <User className="w-10 h-10 sm:w-12 sm:h-12 text-white/70" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-telegram-bg-light border-2 border-telegram-bg flex items-center justify-center">
                      <Camera className="w-4 h-4 text-telegram-blue" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Name Input */}
                <div className="bg-telegram-bg-light/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-telegram-border/50">
                  <Input
                    {...register('name')}
                    label="Your Name"
                    placeholder="Enter your name"
                    error={errors.name?.message}
                    leftIcon={<User className="w-5 h-5" />}
                  />
                </div>

                <Button
                  onClick={() => watchedName && setStep(2)}
                  className="w-full"
                  size="lg"
                  disabled={!watchedName}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Continue
                </Button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full text-telegram-text-secondary hover:text-white transition-colors text-sm"
                >
                  Skip for now
                </button>
              </div>
            </>
          ) : (
            // Step 2: Username and Bio
            <>
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Almost Done!
                </h1>
                <p className="text-telegram-text-secondary text-sm sm:text-base">
                  Add a username and bio (optional)
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="bg-telegram-bg-light/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-telegram-border/50 space-y-4">
                  <Input
                    {...register('username')}
                    label="Username"
                    placeholder="username"
                    error={errors.username?.message}
                    leftIcon={<AtSign className="w-5 h-5" />}
                    hint="Others can find you by this username"
                  />

                  <div>
                    <label className="block text-sm font-medium text-telegram-text-secondary mb-2">
                      Bio
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-telegram-text-secondary" />
                      <textarea
                        {...register('bio')}
                        placeholder="Tell something about yourself..."
                        rows={3}
                        className={cn(
                          'w-full bg-telegram-bg-light border border-telegram-border rounded-xl',
                          'pl-10 pr-4 py-3 text-white placeholder-telegram-text-secondary',
                          'focus:outline-none focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue',
                          'transition-all duration-200 resize-none'
                        )}
                      />
                    </div>
                    {errors.bio && (
                      <p className="mt-2 text-sm text-red-500">{errors.bio.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    isLoading={isLoading}
                    rightIcon={!isLoading && <Check className="w-5 h-5" />}
                  >
                    {isLoading ? 'Saving...' : 'Complete'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
