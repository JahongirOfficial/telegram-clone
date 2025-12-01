import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Bell,
  Palette,
  Globe,
  Eye,
  Clock,
  Image,
  CheckCircle,
  Volume2,
  Vibrate,
  MessageSquare,
  Users,
  Sun,
  Moon,
  Monitor,
  Loader2,
  Check,
} from 'lucide-react';
import { settingsApi, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Settings {
  privacy: {
    lastSeen: 'everyone' | 'contacts' | 'nobody';
    profilePhoto: 'everyone' | 'contacts' | 'nobody';
    onlineStatus: 'everyone' | 'contacts' | 'nobody';
    readReceipts: boolean;
  };
  notifications: {
    messages: boolean;
    groups: boolean;
    sounds: boolean;
    vibration: boolean;
    preview: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
}

type SettingsSection = 'main' | 'privacy' | 'notifications' | 'theme';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>('main');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      setSettings(response.data.data);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (path: string, value: any) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const [category, key] = path.split('.');
      const updateData: any = {};

      if (key) {
        updateData[category] = { [key]: value };
      } else {
        updateData[category] = value;
      }

      const response = await settingsApi.updateSettings(updateData);
      setSettings(response.data.data);
      showSuccess('Settings updated');
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-telegram-blue animate-spin" />
      </div>
    );
  }

  const renderMainMenu = () => (
    <div className="space-y-2">
      <button
        onClick={() => setActiveSection('privacy')}
        className="w-full flex items-center gap-4 p-4 bg-telegram-bg-light rounded-xl hover:bg-telegram-bg-lighter transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-telegram-blue/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-telegram-blue" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium">Privacy</p>
          <p className="text-telegram-text-secondary text-sm">Last seen, profile photo, read receipts</p>
        </div>
        <ArrowLeft className="w-5 h-5 text-telegram-text-secondary rotate-180" />
      </button>

      <button
        onClick={() => setActiveSection('notifications')}
        className="w-full flex items-center gap-4 p-4 bg-telegram-bg-light rounded-xl hover:bg-telegram-bg-lighter transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium">Notifications</p>
          <p className="text-telegram-text-secondary text-sm">Messages, sounds, vibration</p>
        </div>
        <ArrowLeft className="w-5 h-5 text-telegram-text-secondary rotate-180" />
      </button>

      <button
        onClick={() => setActiveSection('theme')}
        className="w-full flex items-center gap-4 p-4 bg-telegram-bg-light rounded-xl hover:bg-telegram-bg-lighter transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Palette className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium">Appearance</p>
          <p className="text-telegram-text-secondary text-sm">Theme: {settings?.theme}</p>
        </div>
        <ArrowLeft className="w-5 h-5 text-telegram-text-secondary rotate-180" />
      </button>

      <div className="flex items-center gap-4 p-4 bg-telegram-bg-light rounded-xl">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-orange-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-medium">Language</p>
          <p className="text-telegram-text-secondary text-sm">English</p>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-4">
      {/* Last Seen */}
      <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
        <div className="p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-telegram-text-secondary" />
            <p className="text-white font-medium">Last Seen</p>
          </div>
          <p className="text-telegram-text-secondary text-sm">Who can see your last seen time</p>
        </div>
        {(['everyone', 'contacts', 'nobody'] as const).map((option) => (
          <button
            key={option}
            onClick={() => updateSetting('privacy.lastSeen', option)}
            className="w-full flex items-center justify-between p-4 hover:bg-telegram-bg-lighter transition-colors"
          >
            <span className="text-white capitalize">{option}</span>
            {settings?.privacy.lastSeen === option && (
              <Check className="w-5 h-5 text-telegram-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Profile Photo */}
      <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
        <div className="p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3 mb-3">
            <Image className="w-5 h-5 text-telegram-text-secondary" />
            <p className="text-white font-medium">Profile Photo</p>
          </div>
          <p className="text-telegram-text-secondary text-sm">Who can see your profile photo</p>
        </div>
        {(['everyone', 'contacts', 'nobody'] as const).map((option) => (
          <button
            key={option}
            onClick={() => updateSetting('privacy.profilePhoto', option)}
            className="w-full flex items-center justify-between p-4 hover:bg-telegram-bg-lighter transition-colors"
          >
            <span className="text-white capitalize">{option}</span>
            {settings?.privacy.profilePhoto === option && (
              <Check className="w-5 h-5 text-telegram-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Online Status */}
      <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
        <div className="p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-telegram-text-secondary" />
            <p className="text-white font-medium">Online Status</p>
          </div>
          <p className="text-telegram-text-secondary text-sm">Who can see when you're online</p>
        </div>
        {(['everyone', 'contacts', 'nobody'] as const).map((option) => (
          <button
            key={option}
            onClick={() => updateSetting('privacy.onlineStatus', option)}
            className="w-full flex items-center justify-between p-4 hover:bg-telegram-bg-lighter transition-colors"
          >
            <span className="text-white capitalize">{option}</span>
            {settings?.privacy.onlineStatus === option && (
              <Check className="w-5 h-5 text-telegram-blue" />
            )}
          </button>
        ))}
      </div>

      {/* Read Receipts */}
      <div className="bg-telegram-bg-light rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Read Receipts</p>
              <p className="text-telegram-text-secondary text-sm">Show when you've read messages</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('privacy.readReceipts', !settings?.privacy.readReceipts)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.privacy.readReceipts ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.privacy.readReceipts ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
        {/* Messages */}
        <div className="flex items-center justify-between p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Messages</p>
              <p className="text-telegram-text-secondary text-sm">Private chat notifications</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('notifications.messages', !settings?.notifications.messages)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.notifications.messages ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.notifications.messages ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Groups */}
        <div className="flex items-center justify-between p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Groups</p>
              <p className="text-telegram-text-secondary text-sm">Group chat notifications</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('notifications.groups', !settings?.notifications.groups)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.notifications.groups ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.notifications.groups ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Sounds */}
        <div className="flex items-center justify-between p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Sounds</p>
              <p className="text-telegram-text-secondary text-sm">Play notification sounds</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('notifications.sounds', !settings?.notifications.sounds)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.notifications.sounds ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.notifications.sounds ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between p-4 border-b border-telegram-border">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Vibration</p>
              <p className="text-telegram-text-secondary text-sm">Vibrate on notifications</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('notifications.vibration', !settings?.notifications.vibration)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.notifications.vibration ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.notifications.vibration ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Preview */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-telegram-text-secondary" />
            <div>
              <p className="text-white font-medium">Message Preview</p>
              <p className="text-telegram-text-secondary text-sm">Show message content in notifications</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('notifications.preview', !settings?.notifications.preview)}
            className={cn(
              'w-12 h-7 rounded-full transition-colors relative',
              settings?.notifications.preview ? 'bg-telegram-blue' : 'bg-telegram-bg-lighter'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                settings?.notifications.preview ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-4">
      <div className="bg-telegram-bg-light rounded-xl overflow-hidden">
        <button
          onClick={() => updateSetting('theme', 'light')}
          className="w-full flex items-center justify-between p-4 border-b border-telegram-border hover:bg-telegram-bg-lighter transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-white">Light</span>
          </div>
          {settings?.theme === 'light' && <Check className="w-5 h-5 text-telegram-blue" />}
        </button>

        <button
          onClick={() => updateSetting('theme', 'dark')}
          className="w-full flex items-center justify-between p-4 border-b border-telegram-border hover:bg-telegram-bg-lighter transition-colors"
        >
          <div className="flex items-center gap-3">
            <Moon className="w-5 h-5 text-blue-400" />
            <span className="text-white">Dark</span>
          </div>
          {settings?.theme === 'dark' && <Check className="w-5 h-5 text-telegram-blue" />}
        </button>

        <button
          onClick={() => updateSetting('theme', 'system')}
          className="w-full flex items-center justify-between p-4 hover:bg-telegram-bg-lighter transition-colors"
        >
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-telegram-text-secondary" />
            <span className="text-white">System</span>
          </div>
          {settings?.theme === 'system' && <Check className="w-5 h-5 text-telegram-blue" />}
        </button>
      </div>

      <p className="text-telegram-text-secondary text-sm text-center px-4">
        Choose your preferred theme. System will automatically switch based on your device settings.
      </p>
    </div>
  );

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'privacy':
        return 'Privacy';
      case 'notifications':
        return 'Notifications';
      case 'theme':
        return 'Appearance';
      default:
        return 'Settings';
    }
  };

  return (
    <div className="min-h-screen bg-telegram-bg">
      {/* Header */}
      <header className="bg-telegram-bg-light border-b border-telegram-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => activeSection === 'main' ? navigate('/') : setActiveSection('main')}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-telegram-bg-lighter transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-telegram-text-secondary" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-white">{getSectionTitle()}</h1>
          {isSaving && <Loader2 className="w-5 h-5 text-telegram-blue animate-spin ml-auto" />}
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-3 sm:p-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-telegram-green/20 border border-telegram-green/50 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-telegram-green" />
            <span className="text-telegram-green text-sm">{successMessage}</span>
          </div>
        )}

        {activeSection === 'main' && renderMainMenu()}
        {activeSection === 'privacy' && renderPrivacySettings()}
        {activeSection === 'notifications' && renderNotificationSettings()}
        {activeSection === 'theme' && renderThemeSettings()}
      </div>
    </div>
  );
};
