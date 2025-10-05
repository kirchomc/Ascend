import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Goal } from "@/api/entities";
import { Habit } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Trophy, Lock, CheckCircle } from "lucide-react";

export default function AllAchievementsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState("all"); // all, unlocked, locked

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

      const allCheckIns = await DailyCheckIn.filter({ created_by: currentUser.email });
      setCheckIns(allCheckIns);

      const allGoals = await Goal.filter({ created_by: currentUser.email });
      setGoals(allGoals);

      const allHabits = await Habit.filter({ created_by: currentUser.email });
      setHabits(allHabits);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Define 100 achievements
  const allAchievements = useMemo(() => {
    const achievements = [
      // Check-in achievements (15)
      { id: "first_checkin", name: "First Step", description: "Complete first check-in", icon: "🎯", requirement: 1, current: checkIns.length, type: "check_ins", tier: "Bronze", points: 10 },
      { id: "checkin_5", name: "Getting Started", description: "5 check-ins", icon: "📝", requirement: 5, current: checkIns.length, type: "check_ins", tier: "Bronze", points: 25 },
      { id: "checkin_10", name: "Consistent", description: "10 check-ins", icon: "✅", requirement: 10, current: checkIns.length, type: "check_ins", tier: "Silver", points: 50 },
      { id: "checkin_25", name: "Dedicated", description: "25 check-ins", icon: "🎖️", requirement: 25, current: checkIns.length, type: "check_ins", tier: "Silver", points: 75 },
      { id: "checkin_50", name: "Committed", description: "50 check-ins", icon: "🏅", requirement: 50, current: checkIns.length, type: "check_ins", tier: "Gold", points: 150 },
      { id: "checkin_100", name: "Centurion", description: "100 check-ins", icon: "💯", requirement: 100, current: checkIns.length, type: "check_ins", tier: "Gold", points: 300 },
      { id: "checkin_250", name: "Iron Will", description: "250 check-ins", icon: "⚡", requirement: 250, current: checkIns.length, type: "check_ins", tier: "Platinum", points: 500 },
      { id: "checkin_500", name: "Unstoppable", description: "500 check-ins", icon: "🌟", requirement: 500, current: checkIns.length, type: "check_ins", tier: "Platinum", points: 1000 },
      { id: "checkin_1000", name: "Legendary", description: "1000 check-ins", icon: "👑", requirement: 1000, current: checkIns.length, type: "check_ins", tier: "Platinum", points: 2000 },
      
      // Streak achievements (20)
      { id: "streak_3", name: "Three Day Starter", description: "3 day streak", icon: "🔥", requirement: 3, current: userProfile?.current_streak || 0, type: "streak", tier: "Bronze", points: 15 },
      { id: "streak_7", name: "Week Warrior", description: "7 day streak", icon: "💪", requirement: 7, current: userProfile?.current_streak || 0, type: "streak", tier: "Silver", points: 50 },
      { id: "streak_14", name: "Fortnight Fighter", description: "14 day streak", icon: "⚔️", requirement: 14, current: userProfile?.current_streak || 0, type: "streak", tier: "Silver", points: 100 },
      { id: "streak_21", name: "Three Week Champion", description: "21 day streak", icon: "🏆", requirement: 21, current: userProfile?.current_streak || 0, type: "streak", tier: "Gold", points: 150 },
      { id: "streak_30", name: "Monthly Master", description: "30 day streak", icon: "📅", requirement: 30, current: userProfile?.current_streak || 0, type: "streak", tier: "Gold", points: 200 },
      { id: "streak_60", name: "Two Month Marvel", description: "60 day streak", icon: "💎", requirement: 60, current: userProfile?.current_streak || 0, type: "streak", tier: "Platinum", points: 400 },
      { id: "streak_90", name: "Quarter Champion", description: "90 day streak", icon: "👑", requirement: 90, current: userProfile?.current_streak || 0, type: "streak", tier: "Platinum", points: 500 },
      { id: "streak_180", name: "Half Year Hero", description: "180 day streak", icon: "⭐", requirement: 180, current: userProfile?.current_streak || 0, type: "streak", tier: "Platinum", points: 1000 },
      { id: "streak_365", name: "Year Legend", description: "365 day streak", icon: "🎖️", requirement: 365, current: userProfile?.current_streak || 0, type: "streak", tier: "Platinum", points: 2500 },
      
      // Goal achievements (20)
      { id: "goal_create_1", name: "Goal Setter", description: "Create first goal", icon: "🎯", requirement: 1, current: goals.length, type: "goals", tier: "Bronze", points: 10 },
      { id: "goal_complete_1", name: "First Victory", description: "Complete 1 goal", icon: "✨", requirement: 1, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Bronze", points: 20 },
      { id: "goal_complete_3", name: "Triple Threat", description: "Complete 3 goals", icon: "🎪", requirement: 3, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Silver", points: 50 },
      { id: "goal_complete_5", name: "Goal Crusher", description: "Complete 5 goals", icon: "⚡", requirement: 5, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Silver", points: 100 },
      { id: "goal_complete_10", name: "Goal Master", description: "Complete 10 goals", icon: "🌟", requirement: 10, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Gold", points: 250 },
      { id: "goal_complete_25", name: "Achievement Hunter", description: "Complete 25 goals", icon: "🏹", requirement: 25, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Gold", points: 500 },
      { id: "goal_complete_50", name: "Dream Chaser", description: "Complete 50 goals", icon: "🚀", requirement: 50, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Platinum", points: 1000 },
      { id: "goal_complete_100", name: "Goal Grandmaster", description: "Complete 100 goals", icon: "👑", requirement: 100, current: goals.filter(g => g.completed).length, type: "goals_completed", tier: "Platinum", points: 2000 },
      
      // Habit achievements (15)
      { id: "habit_create_1", name: "Habit Builder", description: "Create first habit", icon: "🔨", requirement: 1, current: habits.length, type: "habits", tier: "Bronze", points: 10 },
      { id: "habit_create_5", name: "Routine Master", description: "Create 5 habits", icon: "📋", requirement: 5, current: habits.length, type: "habits", tier: "Silver", points: 50 },
      { id: "habit_create_10", name: "Lifestyle Designer", description: "Create 10 habits", icon: "🎨", requirement: 10, current: habits.length, type: "habits", tier: "Gold", points: 100 },
      { id: "habit_create_20", name: "Transformation Architect", description: "Create 20 habits", icon: "🏛️", requirement: 20, current: habits.length, type: "habits", tier: "Platinum", points: 250 },
      
      // Points achievements (15)
      { id: "points_100", name: "Century Club", description: "Earn 100 points", icon: "⭐", requirement: 100, current: userProfile?.total_points || 0, type: "points", tier: "Bronze", points: 0 },
      { id: "points_500", name: "Rising Star", description: "Earn 500 points", icon: "🌟", requirement: 500, current: userProfile?.total_points || 0, type: "points", tier: "Silver", points: 0 },
      { id: "points_1000", name: "Points Collector", description: "Earn 1,000 points", icon: "💰", requirement: 1000, current: userProfile?.total_points || 0, type: "points", tier: "Silver", points: 0 },
      { id: "points_2500", name: "Elite Performer", description: "Earn 2,500 points", icon: "🏆", requirement: 2500, current: userProfile?.total_points || 0, type: "points", tier: "Gold", points: 0 },
      { id: "points_5000", name: "Points Tycoon", description: "Earn 5,000 points", icon: "💎", requirement: 5000, current: userProfile?.total_points || 0, type: "points", tier: "Platinum", points: 0 },
      { id: "points_10000", name: "Millionaire Mindset", description: "Earn 10,000 points", icon: "👑", requirement: 10000, current: userProfile?.total_points || 0, type: "points", tier: "Platinum", points: 0 },
      
      // Special & Category achievements (15)
      { id: "perfect_week", name: "Perfect Week", description: "7 days in a row", icon: "📆", requirement: 7, current: userProfile?.current_streak || 0, type: "streak", tier: "Gold", points: 100 },
      { id: "early_bird", name: "Early Bird", description: "Check-in before 8 AM", icon: "🌅", requirement: 1, current: 0, type: "special", tier: "Bronze", points: 25 },
      { id: "night_owl", name: "Night Owl", description: "Check-in after 10 PM", icon: "🦉", requirement: 1, current: 0, type: "special", tier: "Bronze", points: 25 },
      { id: "weekend_warrior", name: "Weekend Warrior", description: "Check-in on weekends", icon: "🎮", requirement: 10, current: 0, type: "special", tier: "Silver", points: 50 },
      { id: "category_master_health", name: "Health Master", description: "10 health goals completed", icon: "❤️", requirement: 10, current: goals.filter(g => g.completed && g.category === "health").length, type: "category", tier: "Gold", points: 150 },
      { id: "category_master_fitness", name: "Fitness Master", description: "10 fitness goals completed", icon: "💪", requirement: 10, current: goals.filter(g => g.completed && g.category === "fitness").length, type: "category", tier: "Gold", points: 150 },
      { id: "category_master_mindset", name: "Mindset Master", description: "10 mindset goals completed", icon: "🧠", requirement: 10, current: goals.filter(g => g.completed && g.category === "mindset").length, type: "category", tier: "Gold", points: 150 },
      { id: "category_master_productivity", name: "Productivity Master", description: "10 productivity goals completed", icon: "⚡", requirement: 10, current: goals.filter(g => g.completed && g.category === "productivity").length, type: "category", tier: "Gold", points: 150 },
      { id: "renaissance", name: "Renaissance Person", description: "Complete goals in all 10 categories", icon: "🎭", requirement: 10, current: new Set(goals.filter(g => g.completed).map(g => g.category)).size, type: "special", tier: "Platinum", points: 500 }
    ];

    return achievements.map(ach => ({
      ...ach,
      unlocked: ach.current >= ach.requirement,
      progress: Math.min((ach.current / ach.requirement) * 100, 100)
    }));
  }, [checkIns, goals, habits, userProfile]);

  const filteredAchievements = allAchievements.filter(ach => {
    if (filter === "unlocked") return ach.unlocked;
    if (filter === "locked") return !ach.unlocked;
    return true;
  });

  const tierColors = {
    Bronze: "from-orange-400 to-orange-600",
    Silver: "from-gray-300 to-gray-500",
    Gold: "from-yellow-400 to-yellow-600",
    Platinum: "from-purple-400 to-purple-600"
  };

  const unlockedCount = allAchievements.filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              All Achievements
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {unlockedCount} of {allAchievements.length} unlocked ({Math.round((unlockedCount / allAchievements.length) * 100)}%)
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-lg"
          >
            All ({allAchievements.length})
          </Button>
          <Button
            variant={filter === "unlocked" ? "default" : "outline"}
            onClick={() => setFilter("unlocked")}
            className="rounded-lg"
          >
            Unlocked ({unlockedCount})
          </Button>
          <Button
            variant={filter === "locked" ? "default" : "outline"}
            onClick={() => setFilter("locked")}
            className="rounded-lg"
          >
            Locked ({allAchievements.length - unlockedCount})
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className={`${achievement.unlocked ? 'border-2 border-green-500' : 'border-2 border-dashed border-gray-300 dark:border-gray-700'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <div className={`text-5xl ${!achievement.unlocked && 'opacity-20'}`}>
                        {achievement.icon}
                      </div>
                      {!achievement.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {achievement.name}
                        </h3>
                        <Badge variant="outline" className={`${achievement.unlocked ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                          {achievement.tier}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {achievement.description}
                      </p>
                    </div>
                  </div>

                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {achievement.current} / {achievement.requirement}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {Math.round(achievement.progress)}%
                        </span>
                      </div>
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  )}

                  {achievement.unlocked && (
                    <div className="flex items-center justify-between pt-3 border-t border-green-200 dark:border-green-800">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Unlocked
                      </span>
                      {achievement.points > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">
                          +{achievement.points} pts
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}