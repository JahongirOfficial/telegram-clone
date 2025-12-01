import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  AtSign, 
  FileText, 
  Phone,
  Check,
  X,
  Edit3,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { userApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  
  // Form values
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userApi.getMe();
      const userData = response.data.data;
      setProfile(userData);
      setEditName(userData.name || '');
      setEditUsername(userData.username || '');
      setEditBio(userData.bio || '');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);
    setError('');

    try {
      // Convert to base64 for demo (in production, upload to server/S3)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        try {
          const response = await userApi.updatePhoto(base64);
          setProfile(response.data.data);
          setUser(response.data.data);
          showSuccess('Profile photo updated');
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(getErrorMessage(err));
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await userApi.updateProfile({ name: editName.trim() });
      setProfile(response.data.data);
      setUser(response.data.data);
      setIsEditingName(false);
      showSuccess('Name updated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await userApi.updateProfile({ 
        username: editUsername.trim() || undefined 
      });
      setProfile(response.data.data);
      setUser(response.data.data);
      setIsEditingUsername(false);
      showSuccess('Username updated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBio = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await userApi.updateProfile({ 
        bio: editBio.trim() || undefined 
      });
      setProfile(response.data.data);
      setUser(response.data.data);
      setIsEditingBio(false);
      showSuccess('Bio updated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const cancelEdit = (field: 'name' | 'username' | 'bio') => {
    if (field === 'name') {
      setEditName(profile?.name || '');
      setIsEditingName(false);
    } else if (field === 'username') {
      setEditUsername(profile?.username || '');
      setIsEditingUsername(false);
    } else {
      setEditBio(profile?.bio || '');
      setIsEditingBio(false);
    }
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-telegram-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-telegram-bg">
      {/* Header */}
      <header className="bg-telegram-bg-light border-b border-telegram-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-telegram-text-secondary" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-white">Profile</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-telegram-green/20 border border-telegram-green/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <Check className="w-5 h-5 text-telegram-green" />
            <span className="text-telegram-green">{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-red-500">{error}</span>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="bg-telegram-bg-light rounded-2xl p-4 sm:p-6 border border-telegram-border">
          <div className="flex flex-col items-center">
            <div className="relative">
              <button
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className={cn(
                  'w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center',
                  'bg-gradient-to-br from-telegram-blue to-telegram-blue-dark',
                  'transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-telegram-blue/30',
                  'shadow-lg shadow-telegram-blue/30',
                  isUploadingPhoto && 'opacity-50'
                )}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
                ) : profile?.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {profile?.name ? getInitials(profile.name) : 'U'}
                  </span>
                )}
              </button>
              <div className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-telegram-blue flex items-center justify-center shadow-lg cursor-pointer hover:bg-telegram-blue-dark transition-colors">
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <p className="mt-4 text-telegram-text-secondary text-sm">
              Tap to change photo
            </p>
          </div>
        </div>

        {/* Profile Info Section */}
        <div className="bg-telegram-bg-light rounded-2xl border border-telegram-border overflow-hidden">
          {/* Name Field */}
          <div className="p-3 sm:p-4 border-b border-telegram-border">
            {isEditingName ? (
              <div className="space-y-3">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  leftIcon={<User className="w-5 h-5" />}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancelEdit('name')}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-telegram-text-secondary" />
                  <div>
                    <p className="text-telegram-text-secondary text-sm">Name</p>
                    <p className="text-white font-medium">{profile?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            )}
          </div>

          {/* Username Field */}
          <div className="p-3 sm:p-4 border-b border-telegram-border">
            {isEditingUsername ? (
              <div className="space-y-3">
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                  leftIcon={<AtSign className="w-5 h-5" />}
                  hint="5-32 characters, letters, numbers, underscores"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancelEdit('username')}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AtSign className="w-5 h-5 text-telegram-text-secondary" />
                  <div>
                    <p className="text-telegram-text-secondary text-sm">Username</p>
                    <p className="text-white font-medium">
                      {profile?.username ? `@${profile.username}` : 'Not set'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            )}
          </div>

          {/* Bio Field */}
          <div className="p-3 sm:p-4 border-b border-telegram-border">
            {isEditingBio ? (
              <div className="space-y-3">
                <div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-telegram-text-secondary mt-3" />
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell something about yourself..."
                      rows={3}
                      maxLength={500}
                      className={cn(
                        'flex-1 bg-telegram-bg border border-telegram-border rounded-xl',
                        'px-4 py-3 text-white placeholder-telegram-text-secondary',
                        'focus:outline-none focus:border-telegram-blue focus:ring-1 focus:ring-telegram-blue',
                        'transition-all duration-200 resize-none'
                      )}
                      autoFocus
                    />
                  </div>
                  <p className="text-telegram-text-secondary text-xs mt-2 text-right">
                    {editBio.length}/500
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancelEdit('bio')}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-telegram-text-secondary mt-0.5" />
                  <div>
                    <p className="text-telegram-text-secondary text-sm">Bio</p>
                    <p className="text-white">
                      {profile?.bio || 'Add a few words about yourself'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-telegram-blue" />
                </button>
              </div>
            )}
          </div>

          {/* Phone Number (Read-only) */}
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-telegram-text-secondary" />
              <div>
                <p className="text-telegram-text-secondary text-xs sm:text-sm">Phone</p>
                <p className="text-white font-medium text-sm sm:text-base">{profile?.phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-telegram-text-secondary text-xs sm:text-sm text-center px-4">
          Your profile information is visible to your contacts and people you message.
        </p>
      </div>
    </div>
  );
};
