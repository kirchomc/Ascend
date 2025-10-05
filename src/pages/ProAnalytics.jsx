import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Goal } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Habit } from "@/api/entities";
import { ChallengeParticipant } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Crown, 
  TrendingUp, 
  Target, 
  Calendar, 
  Flame, 
  Trophy,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { differenceInDays, startOfWeek, startOfMonth, format } from "date-fns";

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function ProAnalyticsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [habits, setHabits] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const currentUser = await User.me();
      
      if (currentUser.plan !== 'full') {
        navigate(createPageUrl('PremiumPortal'));
        return;
      }

      setUser(currentUser);

      const [profiles, allGoals, allCheckIns, allHabits, allChallenges] = await Promise.all([
        UserProfile.filter({ created_by: currentUser.email }),
        Goal.filter({ created_by: currentUser.email }),
        DailyCheckIn.filter({ created_by: currentUser.email }),
        Habit.filter({ created_by: currentUser.email }),
        ChallengeParticipant.filter({ created_by: currentUser.email })
      ]);

      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      setGoals(allGoals);
      setCheckIns(allCheckIns);
      setHabits(allHabits);
      setChallenges(allChallenges);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate analytics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const activeHabits = habits.filter(h => h.is_active).length;
  const completedChallenges = challenges.filter(c => c.status === 'completed').length;

  // Goals by category
  const goalsByCategory = goals.reduce((acc, goal) => {
    const cat = goal.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(goalsByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Check-ins over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return format(date, 'MMM dd');
  });

  const checkInData = last30Days.map(day => {
    const count = checkIns.filter(c => format(new Date(c.date || c.created_date), 'MMM dd') === day).length;
    return { date: day, checkIns: count };
  });

  // Streak history (last 12 weeks)
  const streakData = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(new Date());
    weekStart.setDate(weekStart.getDate() - (11 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekCheckIns = checkIns.filter(c => {
      const date = new Date(c.date || c.created_date);
      return date >= weekStart && date <= weekEnd;
    }).length;
    
    return {
      week: format(weekStart, 'MMM dd'),
      streak: weekCheckIns
    };
  });

  // Monthly progress
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return format(date, 'MMM yyyy');
  });

  const monthlyProgress = last6Months.map(month => {
    const [monthName, year] = month.split(' ');
    const goalsCompleted = goals.filter(g => {
      if (!g.completed_at) return false;
      const completedDate = new Date(g.completed_at);
      return format(completedDate, 'MMM yyyy') === month;
    }).length;
    
    return { month: monthName, goals: goalsCompleted };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Advanced Analytics
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mt-1">
                <Crown className="w-3 h-3 mr-1" />
                Pro Feature
              </Badge>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Deep insights into your progress and patterns
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                  {goalCompletionRate}%
                </Badge>
              </div>
              <p className="text-2xl font-bold dark:text-white">{completedGoals}/{totalGoals}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Goals Completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-8 h-8 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Current
                </Badge>
              </div>
              <p className="text-2xl font-bold dark:text-white">{userProfile?.current_streak || 0} days</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-green-600" />
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Active
                </Badge>
              </div>
              <p className="text-2xl font-bold dark:text-white">{activeHabits}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Habits</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-8 h-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Total
                </Badge>
              </div>
              <p className="text-2xl font-bold dark:text-white">{completedChallenges}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Challenges Won</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Calendar className="w-5 h-5 text-purple-600" />
                Daily Check-Ins (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={checkInData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="checkIns" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                Goals by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Flame className="w-5 h-5 text-orange-600" />
                Streak History (Last 12 Weeks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={streakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="streak" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Monthly Progress (Last 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="goals" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}