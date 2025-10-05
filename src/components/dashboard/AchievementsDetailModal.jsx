
import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Award, Flame, Lock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AchievementsDetailModal({ open, onClose, milestones, totalPoints, currentStreak, checkIns, goals }) {
  const navigate = useNavigate();

  // Define all possible achievements
  const allAchievements = useMemo(() => {
    const achievements = [
      {
        id: "first_checkin",
        name: "First Step",
        description: "Complete your first check-in",
        icon: "🎯",
        requirement: 1,
        current: checkIns?.length || 0,
        type: "check_ins",
        tier: "Bronze",
        points: 10
      },
      {
        id: "week_warrior",
        name: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: "🔥",
        requirement: 7,
        current: currentStreak || 0,
        type: "streak",
        tier: "Silver",
        points: 50
      },
      {
        id: "fortnight_fighter",
        name: "Fortnight Fighter",
        description: "Maintain a 14-day streak",
        icon: "💪",
        requirement: 14,
        current: currentStreak || 0,
        type: "streak",
        tier: "Gold",
        points: 100
      },
      {
        id: "monthly_master",
        name: "Monthly Master",
        description: "Maintain a 30-day streak",
        icon: "🏆",
        requirement: 30,
        current: currentStreak || 0,
        type: "streak",
        tier: "Gold",
        points: 200
      },
      {
        id: "quarter_champion",
        name: "Quarter Champion",
        description: "Maintain a 90-day streak",
        icon: "👑",
        requirement: 90,
        current: currentStreak || 0,
        type: "streak",
        tier: "Platinum",
        points: 500
      },
      {
        id: "goal_setter",
        name: "Goal Setter",
        description: "Create your first goal",
        icon: "🎯",
        requirement: 1,
        current: goals?.length || 0,
        type: "goals",
        tier: "Bronze",
        points: 10
      },
      {
        id: "goal_crusher",
        name: "Goal Crusher",
        description: "Complete 5 goals",
        icon: "⚡",
        requirement: 5,
        current: goals?.filter(g => g.completed).length || 0,
        type: "goals",
        tier: "Silver",
        points: 100
      },
      {
        id: "goal_master",
        name: "Goal Master",
        description: "Complete 10 goals",
        icon: "🌟",
        requirement: 10,
        current: goals?.filter(g => g.completed).length || 0,
        type: "goals",
        tier: "Gold",
        points: 250
      },
      {
        id: "milestone_master",
        name: "Milestone Master",
        description: "Set 10 milestones",
        icon: "⛰️", // Using a mountain icon for milestones
        requirement: 10,
        current: milestones?.length || 0,
        type: "milestones",
        tier: "Gold",
        points: 200
      },
      {
        id: "centurion",
        name: "Centurion",
        description: "Complete 100 check-ins",
        icon: "💯",
        requirement: 100,
        current: checkIns?.length || 0,
        type: "check_ins",
        tier: "Gold",
        points: 300
      },
      {
        id: "points_collector",
        name: "Points Collector",
        description: "Earn 1,000 points",
        icon: "⭐",
        requirement: 1000,
        current: totalPoints || 0,
        type: "points",
        tier: "Silver",
        points: 0
      },
      {
        id: "points_tycoon",
        name: "Points Tycoon",
        description: "Earn 5,000 points",
        icon: "💎",
        requirement: 5000,
        current: totalPoints || 0,
        type: "points",
        tier: "Platinum",
        points: 0
      },
      {
        id: "dedication",
        name: "Dedication",
        description: "Check in 50 times",
        icon: "🎖️",
        requirement: 50,
        current: checkIns?.length || 0,
        type: "check_ins",
        tier: "Silver",
        points: 150
      }
    ];

    return achievements.map(ach => ({
      ...ach,
      unlocked: ach.current >= ach.requirement,
      progress: Math.min((ach.current / ach.requirement) * 100, 100)
    }));
  }, [currentStreak, checkIns, goals, milestones, totalPoints]); // Added milestones to dependency array

  const unlockedAchievements = allAchievements.filter(a => a.unlocked);
  const lockedAchievements = allAchievements.filter(a => !a.unlocked);

  const tierColors = {
    Bronze: "from-orange-400 to-orange-600",
    Silver: "from-gray-300 to-gray-500",
    Gold: "from-yellow-400 to-yellow-600",
    Platinum: "from-purple-400 to-purple-600"
  };

  const totalAchievements = allAchievements.length;
  const totalUnlocked = unlockedAchievements.length;
  const totalPointsFromAchievements = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  const handleViewAll = () => {
    onClose();
    navigate(createPageUrl("AllAchievements"));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Your Achievements
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUnlocked}/{totalAchievements}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unlocked</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <Star className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPointsFromAchievements}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bonus Points</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentStreak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
            </div>
          </div>

          {unlockedAchievements.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Unlocked Achievements</h3>
                <Button variant="outline" size="sm" onClick={handleViewAll} className="rounded-lg">
                  View All 100+
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-5 bg-gradient-to-br ${tierColors[achievement.tier]} rounded-xl text-white shadow-lg`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-bold">
                            {achievement.name}
                          </h4>
                          <Badge className="bg-white/20 text-white border-0">
                            {achievement.tier}
                          </Badge>
                        </div>
                        <p className="text-white/90 text-sm mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            +{achievement.points} pts
                          </span>
                          <span className="text-white/80">
                            ✓ Unlocked
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Locked Achievements</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="p-5 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="text-5xl opacity-30">{achievement.icon}</div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {achievement.name}
                          </h4>
                          <Badge variant="outline" className="border-gray-400">
                            {achievement.tier}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                          {achievement.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {achievement.current} / {achievement.requirement}
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {Math.round(achievement.progress)}%
                            </span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                        {achievement.points > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Reward: +{achievement.points} points
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose} className="rounded-xl">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
