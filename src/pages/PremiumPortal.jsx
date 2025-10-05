import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Crown,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Zap,
  Trophy,
  Target,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
  Star,
  Rocket,
  Heart
} from "lucide-react";

const LITE_FEATURES = [
  { icon: Target, text: "5 Active Goals", available: true },
  { icon: BookOpen, text: "10 Journal Entries/Month", available: true },
  { icon: Zap, text: "Track 5 Habits Daily", available: true },
  { icon: Trophy, text: "Join Challenges", available: true },
  { icon: Users, text: "Community Access", available: true },
  { icon: Shield, text: "Basic Support", available: true },
  { icon: Target, text: "Unlimited Goals", available: false },
  { icon: BookOpen, text: "Unlimited Journal Entries", available: false },
  { icon: Zap, text: "Unlimited Habit Tracking", available: false },
  { icon: Sparkles, text: "AI Goal Assistant", available: false },
  { icon: TrendingUp, text: "Advanced Analytics", available: false },
  { icon: Shield, text: "Priority Support", available: false }
];

const PRO_FEATURES = [
  { icon: Target, text: "Unlimited Goals", highlight: true },
  { icon: BookOpen, text: "Unlimited Journal Entries", highlight: true },
  { icon: Zap, text: "Unlimited Habit Tracking", highlight: true },
  { icon: Sparkles, text: "AI Goal Assistant with Smart Suggestions", highlight: true },
  { icon: Trophy, text: "Exclusive Pro Challenges", highlight: true },
  { icon: Shield, text: "Priority Support", highlight: true },
  { icon: Star, text: "Exclusive Achievement Badges", highlight: true },
  { icon: TrendingUp, text: "Advanced Analytics Dashboard", highlight: true },
  { icon: Heart, text: "Progress Insights & Reports", highlight: true },
  { icon: Rocket, text: "Early Access to New Features", highlight: true },
  { icon: Users, text: "Premium Community Badge", highlight: true },
  { icon: Sparkles, text: "Custom Themes & Personalization", highlight: true }
];

export default function PremiumPortalPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      await User.updateMyUserData({
        plan: 'full',
        plan_upgraded_date: new Date().toISOString().slice(0, 10)
      });

      await loadUserData();
      setShowUpgradeModal(false);
      
      alert("🎉 Welcome to GrowthPath Pro! You now have access to all premium features!");
    } catch (error) {
      console.error("Error upgrading plan:", error);
      alert("Failed to upgrade plan. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDowngrade = async () => {
    setProcessing(true);
    try {
      await User.updateMyUserData({
        plan: 'lite'
      });

      await loadUserData();
      setShowDowngradeModal(false);
      
      alert("You've been downgraded to Lite plan. You can upgrade again anytime!");
    } catch (error) {
      console.error("Error downgrading plan:", error);
      alert("Failed to downgrade plan. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const isPro = user?.plan === 'full';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="w-20 h-20 text-amber-500 animate-pulse" />
              {isPro && (
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-purple-500 animate-bounce" />
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
            {isPro ? "GrowthPath Pro" : "Upgrade to Pro"}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {isPro 
              ? "You have unlimited access to all premium features. Thank you for your support!"
              : "Unlock unlimited potential with advanced features and AI-powered insights"}
          </p>

          {isPro && (
            <Badge className="mt-4 px-6 py-2 text-lg bg-gradient-to-r from-purple-600 to-pink-600 border-0">
              <Crown className="w-5 h-5 mr-2" />
              Pro Member Since {user.plan_upgraded_date ? new Date(user.plan_upgraded_date).toLocaleDateString() : 'Today'}
            </Badge>
          )}
        </motion.div>

        {/* Current Status */}
        {isPro && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Alert className="border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-700">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <AlertDescription className="text-purple-900 dark:text-purple-200 text-lg">
                <strong>Pro Status Active:</strong> Enjoying unlimited goals, habits, journal entries, AI assistance, and advanced analytics! ✨
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Lite Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`relative ${!isPro && 'ring-2 ring-gray-300 dark:ring-gray-700'} dark:bg-gray-800 dark:border-gray-700`}>
              {!isPro && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 bg-gray-600">Current Plan</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold dark:text-white">Lite</CardTitle>
                <div className="text-4xl font-bold mt-4 dark:text-white">
                  Free
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400"> forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {LITE_FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      {feature.available ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 ${feature.available ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={feature.available ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600 line-through'}>
                        {feature.text}
                      </span>
                    </div>
                  );
                })}
                
                {isPro && (
                  <Button
                    onClick={() => setShowDowngradeModal(true)}
                    variant="outline"
                    className="w-full mt-6 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  >
                    Downgrade to Lite
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`relative ${isPro ? 'ring-4 ring-purple-500 dark:ring-purple-600 shadow-2xl' : 'ring-2 ring-purple-300'} dark:bg-gray-800 dark:border-purple-700`}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 border-0">
                  {isPro ? '✨ Your Plan' : '🔥 Most Popular'}
                </Badge>
              </div>
              <CardHeader className="text-center pb-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-xl">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Pro
                </CardTitle>
                <div className="text-4xl font-bold mt-4 dark:text-white">
                  $4.99
                  <span className="text-lg font-normal text-gray-500 dark:text-gray-400"> /month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Cancel anytime • No hidden fees
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {PRO_FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <Icon className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className={`${feature.highlight ? 'font-semibold text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>
                        {feature.text}
                      </span>
                    </motion.div>
                  );
                })}
                
                {!isPro && (
                  <Button
                    onClick={() => setShowUpgradeModal(true)}
                    size="lg"
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl py-6 text-lg shadow-xl"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Upgrade to Pro
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}

                {isPro && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl text-center">
                    <p className="text-purple-900 dark:text-purple-200 font-semibold flex items-center justify-center gap-2">
                      <Heart className="w-5 h-5" />
                      Thank you for your support!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Testimonials / Benefits */}
        {!isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Join 1,000+ Pro Members Achieving More
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  Pro members report 3x more goal completions and 2x longer streaks. 
                  Unlock your full potential today!
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Badge variant="outline" className="px-4 py-2 text-sm border-purple-500 text-purple-700 dark:text-purple-300 dark:border-purple-600">
                    ⭐ 4.9/5 Rating
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm border-purple-500 text-purple-700 dark:text-purple-300 dark:border-purple-600">
                    🚀 Cancel Anytime
                  </Badge>
                  <Badge variant="outline" className="px-4 py-2 text-sm border-purple-500 text-purple-700 dark:text-purple-300 dark:border-purple-600">
                    💯 30-Day Guarantee
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upgrade Modal */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl dark:text-white">
                <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Upgrade to Pro
              </DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Unlock unlimited potential and exclusive features
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <AlertDescription className="text-purple-900 dark:text-purple-200">
                  <strong>Special Launch Offer:</strong> Get your first month for just $4.99! 
                  (Regular price: $9.99/month)
                </AlertDescription>
              </Alert>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 dark:text-white">What you'll get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    Unlimited goals, habits & journal entries
                  </li>
                  <li className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    AI-powered goal assistance
                  </li>
                  <li className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    Advanced analytics dashboard
                  </li>
                  <li className="flex items-center gap-2 text-sm dark:text-gray-300">
                    <Check className="w-4 h-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={processing}
                >
                  Maybe Later
                </Button>
                <Button
                  onClick={handleUpgrade}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={processing}
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Downgrade Modal */}
        <Dialog open={showDowngradeModal} onOpenChange={setShowDowngradeModal}>
          <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-2xl dark:text-white">Downgrade to Lite?</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                Are you sure you want to downgrade your plan?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                <AlertDescription className="dark:text-red-300">
                  <strong>You will lose access to:</strong> Unlimited goals, habits, journal entries, 
                  AI assistance, advanced analytics, and priority support.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDowngradeModal(false)}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={processing}
                >
                  Keep Pro
                </Button>
                <Button
                  onClick={handleDowngrade}
                  variant="destructive"
                  className="flex-1"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Downgrade to Lite'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}