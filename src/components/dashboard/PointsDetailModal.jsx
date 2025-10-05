import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Award, Zap, CheckCircle, Target, BookOpen, ArrowLeft, Sparkles, Users, Trophy, Calendar } from "lucide-react";

export default function PointsDetailModal({ open, onClose, totalPoints, checkIns, goals, milestones }) {
  const [showAllWays, setShowAllWays] = useState(false);

  // Calculate points breakdown with actual values
  const checkInPoints = checkIns.reduce((sum, c) => sum + (c.points_earned || 10), 0);
  const completedGoals = goals.filter(g => g.completed);
  const goalPoints = completedGoals.length * 20;
  const milestonePoints = milestones.reduce((sum, m) => sum + (m.points_awarded || 50), 0);
  const habitBonusPoints = Math.max(0, totalPoints - (checkInPoints + goalPoints + milestonePoints));

  const pointsSources = [
    { label: "Daily Check-Ins", points: checkInPoints, icon: CheckCircle, color: "text-green-500", count: checkIns.length, perAction: "10-15 pts each" },
    { label: "Completed Goals", points: goalPoints, icon: Target, color: "text-blue-500", count: completedGoals.length, perAction: "20 pts each" },
    { label: "Milestones", points: milestonePoints, icon: Award, color: "text-yellow-500", count: milestones.length, perAction: "50-100 pts each" },
    { label: "Habit Bonuses", points: habitBonusPoints, icon: Zap, color: "text-purple-500", count: "-", perAction: "5-10 pts each" }
  ];

  const pointsRanks = [
    { min: 0, max: 99, title: "Beginner", icon: "🌱", color: "from-green-400 to-emerald-500" },
    { min: 100, max: 499, title: "Explorer", icon: "🗺️", color: "from-blue-400 to-cyan-500" },
    { min: 500, max: 999, title: "Achiever", icon: "⭐", color: "from-yellow-400 to-orange-500" },
    { min: 1000, max: 2499, title: "Champion", icon: "🏆", color: "from-orange-400 to-red-500" },
    { min: 2500, max: 4999, title: "Master", icon: "👑", color: "from-purple-400 to-pink-500" },
    { min: 5000, max: 9999, title: "Legend", icon: "💎", color: "from-indigo-400 to-purple-500" },
    { min: 10000, max: Infinity, title: "Immortal", icon: "🌟", color: "from-yellow-400 to-amber-500" }
  ];

  const currentRank = pointsRanks.find(r => totalPoints >= r.min && totalPoints <= r.max) || pointsRanks[0];
  const nextRank = pointsRanks[pointsRanks.indexOf(currentRank) + 1];
  const pointsToNext = nextRank ? nextRank.min - totalPoints : 0;

  const additionalWays = [
    { action: "Join Weekly Challenges", points: "50-500 pts", icon: Trophy, color: "text-orange-500", description: "Compete with the community" },
    { action: "Share Your Journey", points: "25 pts", icon: Users, color: "text-pink-500", description: "Post in community forums" },
    { action: "7-Day Streak Bonus", points: "50 pts", icon: Sparkles, color: "text-yellow-500", description: "Maintain daily check-ins" },
    { action: "30-Day Streak Bonus", points: "100 pts", icon: Calendar, color: "text-blue-500", description: "Reach monthly milestone" },
    { action: "Complete Journal Entry", points: "15 pts", icon: BookOpen, color: "text-indigo-500", description: "Write your thoughts" },
    { action: "Perfect Week (7/7)", points: "75 pts", icon: CheckCircle, color: "text-green-500", description: "Check in all 7 days" }
  ];

  const allWaysToEarn = [
    ...pointsSources.map(s => ({ ...s, action: s.label, points: s.perAction, description: `${s.count} completed so far` })),
    ...additionalWays
  ];

  if (showAllWays) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowAllWays(false)} className="rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                All Ways To Earn Points
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl">
              <p className="text-center font-medium text-gray-900 dark:text-white">
                Current Total: <span className="text-2xl font-bold text-yellow-600">{totalPoints}</span> points
              </p>
            </div>

            <div className="space-y-3">
              {allWaysToEarn.map((way, index) => {
                const Icon = way.icon;
                return (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-700 ${way.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{way.action}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{way.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0 whitespace-nowrap">
                        {way.points}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowAllWays(false)} className="rounded-xl">
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Your Points Journey
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className={`p-6 bg-gradient-to-br ${currentRank.color} rounded-xl text-white text-center shadow-xl`}>
            <div className="text-6xl mb-3">{currentRank.icon}</div>
            <h3 className="text-2xl font-bold mb-1">{currentRank.title}</h3>
            <p className="text-4xl font-bold mb-2">{totalPoints}</p>
            <p className="text-sm opacity-90">Total Points</p>
            {nextRank && (
              <p className="text-sm opacity-90 mt-2">
                {pointsToNext} Points To {nextRank.icon} {nextRank.title}
              </p>
            )}
          </div>

          {nextRank && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Progress To Next Rank
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keep earning to reach {nextRank.title}!
                  </p>
                </div>
                <div className="text-4xl">{nextRank.icon}</div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">{totalPoints} / {nextRank.min} Points</span>
                  <span className="font-semibold">{Math.round((totalPoints / nextRank.min) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${nextRank.color} transition-all duration-500`}
                    style={{ width: `${Math.min((totalPoints / nextRank.min) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Points Breakdown</h3>
            <div className="space-y-3">
              {pointsSources.map((source, index) => {
                const Icon = source.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white dark:bg-gray-700 ${source.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{source.label}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{source.count} completed • {source.perAction}</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0 text-lg px-4 py-1">
                      {source.points}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                More Ways To Earn Points
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllWays(true)}
                className="rounded-lg"
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {additionalWays.slice(0, 4).map((way, index) => {
                const Icon = way.icon;
                return (
                  <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <Icon className={`w-4 h-4 ${way.color} mb-1`} />
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">{way.action}</p>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{way.points}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">All Ranks</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pointsRanks.map((rank) => {
                const isAchieved = totalPoints >= rank.min;
                const isCurrent = rank === currentRank;
                return (
                  <div 
                    key={rank.title}
                    className={`p-3 rounded-xl text-center border-2 transition-all ${
                      isCurrent 
                        ? `bg-gradient-to-br ${rank.color} text-white border-transparent shadow-lg scale-105` 
                        : isAchieved
                        ? 'bg-gray-100 dark:bg-gray-800 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-1">{rank.icon}</div>
                    <p className={`font-semibold text-xs ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {rank.title}
                    </p>
                    <p className={`text-[10px] ${isCurrent ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {rank.min}+ pts
                    </p>
                    {isAchieved && !isCurrent && (
                      <CheckCircle className="w-4 h-4 mx-auto mt-1 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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