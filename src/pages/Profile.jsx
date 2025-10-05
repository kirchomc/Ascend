
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { DailyCheckIn } from "@/api/entities";
import { Goal } from "@/api/entities"; // New import
import { Milestone } from "@/api/entities";
import { UploadFile } from "@/api/integrations"; // New import
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; // New import
import { Input } from "@/components/ui/input"; // New import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress"; // New import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // AvatarImage new
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // New imports
import {
  Trophy,
  Flame,
  Star,
  CheckCircle,
  Calendar,
  Target, // New import
  Award,
  Edit, // New import
  Upload // New import
} from "lucide-react";
import { format, differenceInDays } from "date-fns"; // differenceInDays new

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [goals, setGoals] = useState([]); // New state
  const [editMode, setEditMode] = useState(false); // New state
  const [displayName, setDisplayName] = useState(""); // New state
  const [avatarUrl, setAvatarUrl] = useState(""); // New state
  const [uploading, setUploading] = useState(false); // New state
  const [saving, setSaving] = useState(false); // New state

  useEffect(() => {
    loadProfile();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener('user:profile:updated', handleProfileUpdate);
    return () => window.removeEventListener('user:profile:updated', handleProfileUpdate);
  }, []);

  const loadProfile = async () => { // Renamed from loadProfileData
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setDisplayName(currentUser.display_name || currentUser.full_name || ""); // New
      setAvatarUrl(currentUser.avatar_url || ""); // New

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      const userMilestones = await Milestone.filter({ created_by: currentUser.email }, '-achieved_date'); // Added sort
      setMilestones(userMilestones);

      const userCheckIns = await DailyCheckIn.filter({ created_by: currentUser.email }, '-date'); // Added sort
      setCheckIns(userCheckIns);

      const userGoals = await Goal.filter({ created_by: currentUser.email }); // New
      setGoals(userGoals); // New
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleImageUpload = async (event) => { // New function
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { file_url } = await UploadFile({ file });
      setAvatarUrl(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => { // New function
    e.preventDefault();
    if (!displayName.trim()) return;

    try {
      setSaving(true);

      await User.updateMyUserData({
        display_name: displayName,
        avatar_url: avatarUrl
      });

      // Reload profile
      const updatedUser = await User.me();
      setUser(updatedUser);

      // Broadcast update
      window.dispatchEvent(new CustomEvent('user:profile:updated', {
        detail: { displayName, avatarUrl }
      }));

      setEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // New calculation for level
  const calculateLevel = (points) => {
    if (points >= 10000) return 10;
    if (points >= 5000) return 9;
    if (points >= 2500) return 8;
    if (points >= 1000) return 7;
    if (points >= 500) return 6;
    if (points >= 250) return 5;
    if (points >= 100) return 4;
    if (points >= 50) return 3;
    if (points >= 25) return 2;
    return 1;
  };

  const level = calculateLevel(userProfile?.total_points || 0);
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalDays = checkIns.length > 0
    ? differenceInDays(new Date(), new Date(checkIns[checkIns.length - 1].date)) + 1
    : 0;

  // Loading state
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-8">
        <div className="max-w-5xl mx-auto text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl font-bold">
                        {(displayName || user.full_name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                    {level}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {displayName || user.full_name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>

                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-4 py-2">
                      <Star className="w-4 h-4 mr-1" />
                      Level {level}
                    </Badge>
                    <Badge className="bg-gradient-to-r from-orange-400 to-red-500 text-white border-0 px-4 py-2">
                      <Flame className="w-4 h-4 mr-1" />
                      {userProfile.current_streak} Day Streak
                    </Badge>
                    <Badge className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-0 px-4 py-2">
                      <Trophy className="w-4 h-4 mr-1" />
                      {userProfile.total_points} Points
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={() => setEditMode(true)}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Calendar className="w-5 h-5 text-blue-500" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Check-ins</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{checkIns.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Active</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Target className="w-5 h-5 text-green-500" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Goals</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{completedGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Award className="w-5 h-5 text-purple-500" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Milestones</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{milestones.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Longest Streak</p>
                  <p className="text-3xl font-bold text-orange-600">{userProfile?.longest_streak || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Milestones/Achievements Section */}
        {milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  All Achievements ({milestones.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((milestone) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="text-4xl mb-2">{milestone.badge_icon || "🏆"}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {milestone.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {milestone.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-0">
                          +{milestone.points_awarded || 50} XP
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {format(new Date(milestone.achieved_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {milestones.length === 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Achievements & Milestones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400">
                                Complete challenges and build streaks to earn achievements!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )}


        {/* Edit Profile Modal */}
        <Dialog open={editMode} onOpenChange={setEditMode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={saveProfile} className="space-y-6 mt-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-32 h-32 border-4 border-gray-200 dark:border-gray-700">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl font-bold">
                      {(displayName || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl cursor-pointer"
                      disabled={uploading}
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={40}
                  className="rounded-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This is how you'll appear to others in the community
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={!displayName.trim() || saving}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
