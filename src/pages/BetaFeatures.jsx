
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Rocket, Sparkles, Beaker, Zap, AlertCircle } from "lucide-react";

const BETA_FEATURES = [
  {
    id: 'ai_voice_coach',
    name: 'AI Voice Coach',
    description: 'Get voice-guided coaching and motivation throughout your day',
    icon: '🎙️',
    status: 'coming_soon',
    estimatedRelease: 'March 2025'
  },
  {
    id: 'social_accountability',
    name: 'Accountability Partners',
    description: 'Connect with other users for mutual accountability and support',
    icon: '🤝',
    status: 'beta',
    enabled: false
  },
  {
    id: 'advanced_ai_insights',
    name: 'Predictive AI Insights',
    description: 'AI predicts your likely success patterns and suggests optimal times for activities',
    icon: '🔮',
    status: 'beta',
    enabled: false
  },
  {
    id: 'habit_stacking',
    name: 'Smart Habit Stacking',
    description: 'Automatically suggests habit combinations based on success patterns',
    icon: '⚡',
    status: 'beta',
    enabled: false
  },
  {
    id: 'meditation_timer',
    name: 'Guided Meditation Timer',
    description: 'Built-in meditation timer with guided sessions',
    icon: '🧘',
    status: 'beta',
    enabled: false
  },
  {
    id: 'custom_themes',
    name: 'Custom Color Themes',
    description: 'Create your own color themes and layouts',
    icon: '🎨',
    status: 'alpha',
    enabled: false
  }
];

export default function BetaFeaturesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState(BETA_FEATURES);
  const [saving, setSaving] = useState(false);

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
      
      // Load user's beta preferences
      const betaPrefs = currentUser.beta_features || {};
      setFeatures(prev => prev.map(f => ({
        ...f,
        enabled: betaPrefs[f.id] || false
      })));
      
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId) => {
    if (saving) return;
    
    setSaving(true);
    try {
      const updatedFeatures = features.map(f => 
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      );
      setFeatures(updatedFeatures);
      
      const betaPrefs = updatedFeatures.reduce((acc, f) => {
        if (f.status !== 'coming_soon') {
          acc[f.id] = f.enabled;
        }
        return acc;
      }, {});
      
      await User.updateMyUserData({ beta_features: betaPrefs });
      
    } catch (error) {
      console.error("Error toggling feature:", error);
      alert("Failed to update feature. Please try again.");
      loadUser(); // Reload to reset state
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'alpha':
        return <Badge className="bg-red-500 text-white">Alpha</Badge>;
      case 'beta':
        return <Badge className="bg-yellow-500 text-white">Beta</Badge>;
      case 'coming_soon':
        return <Badge className="bg-gray-500 text-white">Coming Soon</Badge>;
      default:
        return null;
    }
  };

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
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Early Access Features
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mt-1">
                <Crown className="w-3 h-3 mr-1" />
                Pro Exclusive
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Be the first to try new features before they're released to everyone
          </p>
        </motion.div>

        <Alert className="mb-8 border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-200">
            <strong>Pro Early Access:</strong> As a Pro member, you get exclusive early access to new features before they launch.
            Your feedback helps shape the future of GrowthPath!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${feature.enabled ? 'ring-2 ring-purple-500' : ''} dark:bg-gray-800 dark:border-gray-700`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{feature.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg dark:text-white">{feature.name}</h3>
                          {getStatusBadge(feature.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {feature.description}
                        </p>
                        {feature.status === 'coming_soon' && (
                          <Badge variant="outline" className="text-xs">
                            <Beaker className="w-3 h-3 mr-1" />
                            Estimated: {feature.estimatedRelease}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {feature.status !== 'coming_soon' && (
                      <div className="flex items-center gap-3">
                        <Label htmlFor={`feature-${feature.id}`} className="text-sm text-gray-600 dark:text-gray-400">
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`feature-${feature.id}`}
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          disabled={saving}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900 dark:text-yellow-200">
              <strong>Beta Features Notice:</strong> These features are still in development. 
              You may encounter bugs or incomplete functionality. Your feedback is valuable - 
              please report any issues through our Priority Support.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
