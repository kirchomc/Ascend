import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Palette, Sparkles, Save, RotateCcw, Eye } from "lucide-react";

const PRESET_THEMES = [
  { name: 'Purple Dream', primary: '#8b5cf6', secondary: '#ec4899', accent: '#f59e0b' },
  { name: 'Ocean Breeze', primary: '#06b6d4', secondary: '#3b82f6', accent: '#10b981' },
  { name: 'Sunset Glow', primary: '#f97316', secondary: '#ef4444', accent: '#fbbf24' },
  { name: 'Forest', primary: '#10b981', secondary: '#059669', accent: '#84cc16' },
  { name: 'Midnight', primary: '#6366f1', secondary: '#8b5cf6', accent: '#a855f7' },
  { name: 'Rose Gold', primary: '#f43f5e', secondary: '#ec4899', accent: '#f59e0b' }
];

export default function ThemeCustomizerPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [customTheme, setCustomTheme] = useState({
    primary: '#8b5cf6',
    secondary: '#ec4899',
    accent: '#f59e0b'
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.plan !== 'full') {
        navigate(createPageUrl('PremiumPortal'));
        return;
      }

      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
        
        if (profiles[0].custom_theme) {
          setCustomTheme(profiles[0].custom_theme);
          applyTheme(profiles[0].custom_theme);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgb(theme.primary));
    root.style.setProperty('--color-secondary', hexToRgb(theme.secondary));
    root.style.setProperty('--color-accent', hexToRgb(theme.accent));
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '139, 92, 246';
  };

  const handleColorChange = (key, value) => {
    const newTheme = { ...customTheme, [key]: value };
    setCustomTheme(newTheme);
    applyTheme(newTheme);
  };

  const handlePresetSelect = (preset) => {
    const newTheme = {
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent
    };
    setCustomTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (userProfile) {
        await UserProfile.update(userProfile.id, {
          custom_theme: customTheme
        });
      }
      alert('Theme saved successfully!');
    } catch (error) {
      console.error("Error saving theme:", error);
      alert("Failed to save theme. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaultTheme = { primary: '#8b5cf6', secondary: '#ec4899', accent: '#f59e0b' };
    setCustomTheme(defaultTheme);
    applyTheme(defaultTheme);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Custom Themes
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mt-1">
                <Crown className="w-3 h-3 mr-1" />
                Pro Exclusive
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Personalize your GrowthPath experience with custom colors
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Color Customizer */}
          <div>
            <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Custom Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="primary" className="text-gray-700 dark:text-gray-300 mb-2 block">
                    Primary Color
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      id="primary"
                      value={customTheme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customTheme.primary}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondary" className="text-gray-700 dark:text-gray-300 mb-2 block">
                    Secondary Color
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      id="secondary"
                      value={customTheme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customTheme.secondary}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="#ec4899"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accent" className="text-gray-700 dark:text-gray-300 mb-2 block">
                    Accent Color
                  </Label>
                  <div className="flex gap-3 items-center">
                    <Input
                      type="color"
                      id="accent"
                      value={customTheme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={customTheme.accent}
                      onChange={(e) => handleColorChange('accent', e.target.value)}
                      className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Theme
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preset Themes */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Preset Themes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_THEMES.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => handlePresetSelect(preset)}
                      className="p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-colors"
                    >
                      <div className="flex gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.secondary }} />
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Eye className="w-5 h-5" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="p-6 rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${customTheme.primary} 0%, ${customTheme.secondary} 100%)` }}
                >
                  <h3 className="text-xl font-bold mb-2">Gradient Header</h3>
                  <p className="text-sm opacity-90">This is how your gradients will look</p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-4 py-2 rounded-xl text-white font-medium"
                    style={{ backgroundColor: customTheme.primary }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-xl text-white font-medium"
                    style={{ backgroundColor: customTheme.secondary }}
                  >
                    Secondary
                  </button>
                </div>

                <div className="flex gap-2">
                  <div
                    className="flex-1 h-16 rounded-xl"
                    style={{ backgroundColor: customTheme.primary }}
                  />
                  <div
                    className="flex-1 h-16 rounded-xl"
                    style={{ backgroundColor: customTheme.secondary }}
                  />
                  <div
                    className="flex-1 h-16 rounded-xl"
                    style={{ backgroundColor: customTheme.accent }}
                  />
                </div>

                <div className="p-4 border-2 rounded-xl dark:border-gray-700" style={{ borderColor: customTheme.primary }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: customTheme.accent }} />
                    <span className="text-sm font-medium dark:text-white">Accent Elements</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Icons and highlights will use your accent color
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}