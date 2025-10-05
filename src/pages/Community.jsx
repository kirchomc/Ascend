
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { ForumPost } from "@/api/entities";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Alert, AlertDescription } from "@/components/ui/alert"; // New import
import ProBadge from "../components/community/ProBadge"; // New import
import {
  Trophy,
  Users,
  Star,
  MessageSquare,
  Send,
  Heart,
  WifiOff,
  Flame
} from "lucide-react";

export default function CommunityPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [forumPosts, setForumPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    "general", "health", "fitness", "mindset", "productivity",
    "focus", "relationships", "learning", "creativity", "happiness", "sleep"
  ];

  const loadCommunityData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await User.me();
      setUser(currentUser);

      const profiles = await UserProfile.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading community data:", error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadForumPosts = useCallback(async () => {
    try {
      const posts = await ForumPost.filter({ category: selectedCategory }, '-created_date', 50);
      setForumPosts(posts);
    } catch (error) {
      console.error("Error loading forum posts:", error);
    }
  }, [selectedCategory]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      
      const allUsers = await User.list();
      
      const usersWithProfiles = await Promise.all(
        allUsers.map(async (user) => {
          const profiles = await UserProfile.filter({ created_by: user.email });
          const profile = profiles[0];
          return {
            email: user.email,
            full_name: user.full_name || user.display_name || 'Anonymous User',
            display_name: user.display_name || user.full_name || 'Anonymous',
            avatar_url: user.avatar_url,
            is_pro: user.plan === 'full', // Add Pro status
            total_points: profile?.total_points || 0,
            current_streak: profile?.current_streak || 0
          };
        })
      );
      
      // Show ALL users with points > 0 (no privacy filter)
      const activeUsers = usersWithProfiles.filter(u => u.total_points > 0);
      const sorted = activeUsers.sort((a, b) => b.total_points - a.total_points);
      setLeaderboard(sorted.slice(0, 100));
      
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCommunityData();
  }, [loadCommunityData]);

  useEffect(() => {
    loadForumPosts();
  }, [loadForumPosts]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const handlePostSubmit = async () => {
    if (!newPostContent.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (!navigator.onLine) {
      toast.error("You need to be online to create a post.");
      return;
    }

    try {
      setPosting(true);
      
      const postData = {
        category: selectedCategory,
        content: newPostContent,
        likes_count: 0,
        comments_count: 0,
        author_name: user?.display_name || user?.full_name || 'Anonymous',
        // Assuming author_is_pro would be fetched from user.plan during post creation, if applicable
        // author_is_pro: user?.plan === 'full', 
        is_flagged: false
      };

      await ForumPost.create(postData);
      
      toast.success("Post created successfully!");
      setNewPostContent("");
      
      // Reload posts immediately to show new post
      await loadForumPosts();
      
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Community
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect with others on their growth journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Leaderboard */}
          <div>
            <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Global Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : !navigator.onLine ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <WifiOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Connect to see leaderboard</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                    No active users yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {leaderboard.map((member, index) => (
                      <motion.div
                        key={member.email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                            {(member.display_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {member.display_name}
                            </p>
                            {member.is_pro && <ProBadge />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              {member.total_points}
                            </span>
                            {member.current_streak > 0 && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {member.current_streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Forum */}
          <div className="md:col-span-2">
            <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  Community Forums
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!navigator.onLine && (
                  <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      Forums require an internet connection. Reconnect to participate.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Category Selector */}
                <div className="mb-6">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={!navigator.onLine}>
                    <SelectTrigger className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Create Post */}
                <div className="mb-6">
                  <Textarea
                    placeholder="Share your thoughts with the community..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="rounded-xl mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    maxLength={2000}
                    disabled={!navigator.onLine}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {newPostContent.length}/2000
                    </span>
                    <Button
                      onClick={handlePostSubmit}
                      disabled={!newPostContent.trim() || posting || !navigator.onLine}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      {posting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Share Your Thoughts
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Recent Posts */}
                <div>
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Recent Posts</h3>
                  <div className="space-y-4">
                    {forumPosts.length > 0 ? (
                      forumPosts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="dark:bg-gray-600 dark:text-white">
                                {(post.author_name || post.created_by || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {post.author_name || post.created_by?.split('@')[0] || 'User'}
                                  </p>
                                  {/* Show Pro badge if author is pro - Assumes ForumPost object has 'author_is_pro' field */}
                                  {post.author_is_pro && <ProBadge />} 
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(post.created_date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                                  <Heart className="w-4 h-4" />
                                  {post.likes_count || 0}
                                </button>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="w-4 h-4" />
                                  {post.comments_count || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          No posts yet. Be the first to share!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
