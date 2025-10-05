
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Goal } from "@/api/entities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, Shield, TrendingUp, Target, Calendar } from "lucide-react";

export default function UsersAdmin() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({});

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await User.list('-created_date');
      
      const usersWithStats = await Promise.all(
        allUsers.map(async (user) => {
          try {
            const profiles = await UserProfile.filter({ created_by: user.email });
            const profile = profiles[0];
            
            const checkIns = await DailyCheckIn.filter({ created_by: user.email });
            const goals = await Goal.filter({ created_by: user.email });
            
            return {
              ...user,
              profile,
              totalCheckIns: checkIns.length,
              totalGoals: goals.length,
              completedGoals: goals.filter(g => g.completed).length
            };
          } catch (error) {
            console.error(`Error loading stats for ${user.email}:`, error);
            return {
              ...user,
              profile: null,
              totalCheckIns: 0,
              totalGoals: 0,
              completedGoals: 0
            };
          }
        })
      );
      
      setUsers(usersWithStats);
      
      const totalPoints = usersWithStats.reduce((sum, u) => sum + (u.profile?.total_points || 0), 0);
      const totalCheckIns = usersWithStats.reduce((sum, u) => sum + u.totalCheckIns, 0);
      const totalGoals = usersWithStats.reduce((sum, u) => sum + u.totalGoals, 0);
      
      setStats({
        totalUsers: usersWithStats.length,
        totalPoints,
        totalCheckIns,
        totalGoals,
        avgPointsPerUser: Math.round(totalPoints / usersWithStats.length) || 0
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Users Management</h2>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{stats.totalUsers} registered users</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.totalUsers}</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex-shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.totalPoints?.toLocaleString()}</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.totalCheckIns}</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">Check-Ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.totalGoals}</p>
                <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 truncate">Total Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-10 md:pl-12 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Users List */}
      <div className="grid gap-3 md:gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-3 md:gap-4">
                <Avatar className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-green-500 flex-shrink-0">
                  <AvatarFallback className="text-white font-semibold text-sm md:text-base">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white truncate">
                      {user.full_name || 'Unnamed User'}
                    </h3>
                    {user.role === 'admin' && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-0 text-xs flex-shrink-0">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.plan === 'full' && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-0 text-xs flex-shrink-0">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3 truncate">{user.email}</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs">Points</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.profile?.total_points || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs">Streak</p>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.profile?.current_streak || 0} days
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs">Check-ins</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.totalCheckIns}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs">Goals</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.completedGoals}/{user.totalGoals}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
