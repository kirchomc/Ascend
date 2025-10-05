import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Achievement } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Award, Star, Lock } from "lucide-react";
import { format } from "date-fns";

const tierColors = {
  Bronze: "from-orange-300 to-orange-500",
  Silver: "from-gray-300 to-gray-500",
  Gold: "from-yellow-300 to-yellow-500",
  Platinum: "from-cyan-300 to-cyan-500"
};

const tierIcons = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🥇",
  Platinum: "💎"
};

export default function AchievementsPage() {
  const [user, setUser] = useState(null);
  const [earnedAchievements, setEarnedAchievements] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const userAchievements = await Achievement.filter(
        { created_by: currentUser.email },
        '-earned_at'
      );
      setEarnedAchievements(userAchievements);
    } catch (error) {
      console.error("Error loading achievements:", error);
    }
  };

  const filteredAchievements = filter === "all" 
    ? earnedAchievements 
    : earnedAchievements.filter(a => a.tier === filter);

  const tierCounts = {
    Bronze: earnedAchievements.filter(a => a.tier === "Bronze").length,
    Silver: earnedAchievements.filter(a => a.tier === "Silver").length,
    Gold: earnedAchievements.filter(a => a.tier === "Gold").length,
    Platinum: earnedAchievements.filter(a => a.tier === "Platinum").length
  };

  const totalPoints = earnedAchievements.reduce((sum, a) => sum + (a.points_awarded || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Your Trophies
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Celebrate your progress and achievements
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="shadow-lg">
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                {earnedAchievements.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Trophies</p>
            </CardContent>
          </Card>

          {Object.entries(tierCounts).map(([tier, count]) => (
            <Card key={tier} className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">{tierIcons[tier]}</div>
                <p className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                  {count}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tier}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          {["all", "Bronze", "Silver", "Gold", "Platinum"].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilter(tier)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === tier
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tier === "all" ? "All" : `${tierIcons[tier]} ${tier}`}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${tierColors[achievement.tier]} flex items-center justify-center shadow-xl`}>
                      <span className="text-4xl">{achievement.icon || tierIcons[achievement.tier]}</span>
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge className={`bg-gradient-to-r ${tierColors[achievement.tier]} text-white border-0`}>
                        {achievement.tier}
                      </Badge>
                      {achievement.points_awarded > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          +{achievement.points_awarded}
                        </Badge>
                      )}
                    </div>
                    {achievement.earned_at && (
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                        Earned {format(new Date(achievement.earned_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAchievements.length === 0 && (
            <div className="col-span-full">
              <Card className="shadow-lg">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    No trophies yet in this tier
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Keep working toward your goals to unlock achievements!
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}