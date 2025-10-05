
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Goal } from "@/api/entities";
import { ForumPost } from "@/api/entities";
import { Challenge } from "@/api/entities";
import { ChallengeParticipant } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, TrendingUp, Activity, Target, MessageSquare, Trophy, Shield } from "lucide-react";

export default function AnalyticsAdmin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCheckIns: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalPosts: 0,
    totalChallenges: 0,
    activeChallengeParticipants: 0,
    avgStreak: 0,
    totalPoints: 0
  });
  const [loading, setLoading] = useState(true);
  // Add access check
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const currentUser = await User.me();
      if (currentUser && currentUser.role === 'admin') {
        setUser(currentUser);
        loadAnalytics(); // Load analytics only if admin
      } else {
        setLoading(false); // Stop loading if not admin
      }
    } catch (error) {
      console.error("Error checking admin access:", error);
      setLoading(false); // Stop loading on error
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const [users, profiles, checkIns, goals, posts, challenges, participants] = await Promise.all([
        User.list(),
        UserProfile.list(),
        DailyCheckIn.list(),
        Goal.list(),
        ForumPost.list(),
        Challenge.list(),
        ChallengeParticipant.list()
      ]);

      const activeUsers = profiles.filter(p => p.current_streak > 0).length;
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const activeChallengeParticipants = participants.filter(p => p.status === 'active').length;
      const avgStreak = profiles.length > 0 
        ? Math.round(profiles.reduce((sum, p) => sum + (p.current_streak || 0), 0) / profiles.length) 
        : 0;
      const totalPoints = profiles.reduce((sum, p) => sum + (p.total_points || 0), 0);

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalCheckIns: checkIns.length,
        totalGoals: goals.length,
        completedGoals,
        totalPosts: posts.length,
        totalChallenges: challenges.length,
        activeChallengeParticipants,
        avgStreak,
        totalPoints
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) { // Only show full loading spinner if user is being checked or analytics are loading for an admin
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) { // If user is null after loading, it means not an admin
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          Only administrators can access analytics
        </p>
      </div>
    );
  }

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-400 to-blue-600" },
    { title: "Active Users", value: stats.activeUsers, icon: Activity, color: "from-green-400 to-green-600" },
    { title: "Total Check-Ins", value: stats.totalCheckIns, icon: TrendingUp, color: "from-purple-400 to-purple-600" },
    { title: "Total Goals", value: stats.totalGoals, icon: Target, color: "from-orange-400 to-orange-600" },
    { title: "Completed Goals", value: stats.completedGoals, icon: Target, color: "from-emerald-400 to-emerald-600" },
    { title: "Forum Posts", value: stats.totalPosts, icon: MessageSquare, color: "from-pink-400 to-pink-600" },
    { title: "Total Challenges", value: stats.totalChallenges, icon: Trophy, color: "from-yellow-400 to-yellow-600" },
    { title: "Active Participants", value: stats.activeChallengeParticipants, icon: Users, color: "from-indigo-400 to-indigo-600" },
    { title: "Avg Streak", value: `${stats.avgStreak} days`, icon: Activity, color: "from-red-400 to-red-600" },
    { title: "Total Points", value: stats.totalPoints.toLocaleString(), icon: TrendingUp, color: "from-cyan-400 to-cyan-600" }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Real-time engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Engagement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Goal Completion Rate</span>
                <span className="font-semibold dark:text-white">
                  {stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalGoals > 0 ? (stats.completedGoals / stats.totalGoals) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">User Engagement</span>
                <span className="font-semibold dark:text-white">
                  {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Challenge Participation</span>
                <span className="font-semibold dark:text-white">
                  {stats.totalChallenges > 0 ? Math.round((stats.activeChallengeParticipants / (stats.totalUsers * stats.totalChallenges)) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.totalChallenges > 0 ? Math.min((stats.activeChallengeParticipants / (stats.totalUsers * stats.totalChallenges)) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
