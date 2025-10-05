import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Star,
  Zap,
  Heart,
  Sparkles,
  Crown,
  TrendingUp
} from "lucide-react";

export default function RewardsShopPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [redeeming, setRedeeming] = useState(null);

  const perks = [
    {
      id: "booster_3d_pro",
      type: "booster",
      name: "Pro 3-Day Boost",
      description: "Unlock all Pro features for 3 days",
      points: 300,
      icon: Crown,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "booster_7d_pro",
      type: "booster",
      name: "Pro Week Pass",
      description: "Full Pro access for 7 days",
      points: 600,
      icon: Sparkles,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "custom_quote",
      type: "perk",
      name: "Custom Daily Quote",
      description: "Get a personalized motivational quote",
      points: 150,
      icon: Star,
      color: "from-yellow-400 to-orange-500"
    }
  ];

  const donations = [
    {
      id: "donate_tree",
      type: "donation",
      name: "Plant a Tree",
      description: "Plant a tree through One Tree Planted",
      points: 200,
      icon: Heart,
      color: "from-green-400 to-emerald-500",
      partner: "One Tree Planted"
    },
    {
      id: "donate_meal",
      type: "donation",
      name: "Provide a Meal",
      description: "Donate a meal to someone in need",
      points: 100,
      icon: Heart,
      color: "from-orange-400 to-red-500",
      partner: "Feeding America"
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const redeemReward = async (reward) => {
    if (!userProfile || userProfile.total_points < reward.points) {
      toast.error("Not enough points!");
      return;
    }

    try {
      setRedeeming(reward.id);

      // In production, this would call a backend endpoint
      // that processes the redemption and updates points
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update user's points
      const newPoints = userProfile.total_points - reward.points;
      await UserProfile.update(userProfile.id, {
        total_points: newPoints
      });

      // Reload profile
      const updatedProfiles = await UserProfile.filter({ created_by: user.email });
      setUserProfile(updatedProfiles[0]);

      toast.success(`${reward.name} redeemed successfully!`);

      if (window.gtag) {
        window.gtag('event', 'reward_redeemed', {
          reward_id: reward.id,
          type: reward.type,
          points_cost: reward.points
        });
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("Failed to redeem. Please try again.");
    } finally {
      setRedeeming(null);
    }
  };

  const totalPoints = userProfile?.total_points || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Rewards Shop
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Redeem your points for amazing rewards
              </p>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Your Points Balance
                  </p>
                  <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                    {totalPoints}
                  </p>
                </div>
                <Star className="w-16 h-16 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="perks" className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-2">
            <TabsTrigger value="perks" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Perks & Boosters
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Donations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perks">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {perks.map((perk) => {
                const Icon = perk.icon;
                const canAfford = totalPoints >= perk.points;

                return (
                  <motion.div
                    key={perk.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={`h-full ${!canAfford && 'opacity-60'}`}>
                      <CardHeader>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${perk.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-xl">{perk.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {perk.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">
                            <Star className="w-3 h-3 mr-1" />
                            {perk.points} pts
                          </Badge>
                        </div>
                        <Button
                          className="w-full rounded-xl"
                          disabled={!canAfford || redeeming === perk.id}
                          onClick={() => redeemReward(perk)}
                        >
                          {redeeming === perk.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Redeeming...
                            </>
                          ) : canAfford ? (
                            'Redeem Now'
                          ) : (
                            `Need ${perk.points - totalPoints} more`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="donations">
            <div className="grid md:grid-cols-2 gap-6">
              {donations.map((donation) => {
                const Icon = donation.icon;
                const canAfford = totalPoints >= donation.points;

                return (
                  <motion.div
                    key={donation.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={`h-full ${!canAfford && 'opacity-60'}`}>
                      <CardHeader>
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${donation.color} flex items-center justify-center mb-4`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-xl">{donation.name}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          via {donation.partner}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {donation.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
                            <Star className="w-3 h-3 mr-1" />
                            {donation.points} pts
                          </Badge>
                        </div>
                        <Button
                          className="w-full rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          disabled={!canAfford || redeeming === donation.id}
                          onClick={() => redeemReward(donation)}
                        >
                          {redeeming === donation.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Processing...
                            </>
                          ) : canAfford ? (
                            'Donate Now'
                          ) : (
                            `Need ${donation.points - totalPoints} more`
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}