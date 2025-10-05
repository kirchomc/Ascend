import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings as SettingsIcon,
  Globe,
  Moon,
  Bell,
  Shield,
  CheckCircle
} from "lucide-react";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    language: 'en',
    theme: 'light',
    analytics_consent: true,
    ai_training_consent: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
        setSettings({
          language: currentUser.language || 'en',
          theme: profiles[0].theme_preference || 'light',
          analytics_consent: currentUser.analytics_consent !== false,
          ai_training_consent: currentUser.ai_training_consent !== false
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({
        language: settings.language,
        analytics_consent: settings.analytics_consent,
        ai_training_consent: settings.ai_training_consent
      });

      if (userProfile) {
        await UserProfile.update(userProfile.id, {
          theme_preference: settings.theme
        });
      }

      // Apply theme immediately
      document.documentElement.classList.toggle("dark", settings.theme === "dark");

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Customize your GrowthPath experience
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Language Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Language & Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language" className="text-gray-700 dark:text-gray-300 mb-2 block">
                      App Language
                    </Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings({ ...settings, language: value })}
                    >
                      <SelectTrigger className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {languages.map((lang) => (
                          <SelectItem 
                            key={lang.code} 
                            value={lang.code}
                            className="dark:text-white dark:focus:bg-gray-700"
                          >
                            {lang.flag} {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Change the language of the app interface
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Moon className="w-5 h-5 text-purple-500" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme" className="text-gray-700 dark:text-gray-300 mb-2 block">
                      Theme
                    </Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => setSettings({ ...settings, theme: value })}
                    >
                      <SelectTrigger className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="light" className="dark:text-white dark:focus:bg-gray-700">Light</SelectItem>
                        <SelectItem value="dark" className="dark:text-white dark:focus:bg-gray-700">Dark</SelectItem>
                        <SelectItem value="system" className="dark:text-white dark:focus:bg-gray-700">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Choose your preferred color theme
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Privacy Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Shield className="w-5 h-5 text-green-500" />
                  Privacy & Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="analytics" className="text-gray-700 dark:text-gray-300">
                        Analytics & Usage Data
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Help us improve by sharing anonymous usage data
                      </p>
                    </div>
                    <Switch
                      id="analytics"
                      checked={settings.analytics_consent}
                      onCheckedChange={(checked) => setSettings({ ...settings, analytics_consent: checked })}
                      className="ml-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="ai-training" className="text-gray-700 dark:text-gray-300">
                        AI Training Data
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Allow anonymous data to improve AI features
                      </p>
                    </div>
                    <Switch
                      id="ai-training"
                      checked={settings.ai_training_consent}
                      onCheckedChange={(checked) => setSettings({ ...settings, ai_training_consent: checked })}
                      className="ml-4"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}