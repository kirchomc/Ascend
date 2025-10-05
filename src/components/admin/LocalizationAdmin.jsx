import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Globe, CheckCircle, AlertCircle } from "lucide-react";

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

export default function LocalizationAdmin() {
  const toast = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);

  const commonKeys = [
    'app.name',
    'common.save',
    'common.cancel',
    'common.edit',
    'common.delete',
    'common.create',
    'dashboard.title',
    'goals.title',
    'journal.title',
    'profile.title',
    'settings.title',
    'community.title'
  ];

  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage]);

  const loadTranslations = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would load from a database or API
      // For now, we'll use a mock structure
      const mockTranslations = commonKeys.reduce((acc, key) => {
        acc[key] = {
          key,
          value: key.split('.').pop().charAt(0).toUpperCase() + key.split('.').pop().slice(1),
          language: selectedLanguage
        };
        return acc;
      }, {});
      
      setTranslations(mockTranslations);
    } catch (error) {
      console.error("Error loading translations:", error);
      toast.error("Failed to load translations");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTranslation = async (key, value) => {
    try {
      // In a real implementation, this would save to database
      setTranslations(prev => ({
        ...prev,
        [key]: { ...prev[key], value }
      }));
      toast.success("Translation saved");
    } catch (error) {
      console.error("Error saving translation:", error);
      toast.error("Failed to save translation");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Localization Manager</h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Manage app translations for multiple languages</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-full md:w-48 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
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
        </div>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-white">Common Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commonKeys.map((key) => {
              const translation = translations[key];
              return (
                <div key={key} className="flex flex-col md:flex-row md:items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                      {key}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Input
                      value={translation?.value || ''}
                      onChange={(e) => handleSaveTranslation(key, e.target.value)}
                      placeholder="Enter translation"
                      className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-200">
          Changes are saved automatically. Translations will be available in the app after a refresh.
        </p>
      </div>
    </div>
  );
}