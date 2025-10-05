
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Challenge } from "@/api/entities";
import { ChallengeParticipant } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast"; // Corrected import path for useToast
import { AsyncBoundary, Retry, LoadingSkeleton } from "@/components/utils/AsyncBoundary";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Users, 
  Calendar, 
  Zap, 
  CheckCircle, 
  Clock,
  Infinity,
  Loader2, // ADDED
  Crown // ADDED for Pro features
} from "lucide-react";
import { format, differenceInDays, isBefore, isAfter } from "date-fns";

export default function ChallengesPage() {
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast
  const [user, setUser] = useState(null);
  const [state, setState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [challenges, setChallenges] = useState([]);
  const [myParticipations, setMyParticipations] = useState([]);
  const [joiningChallenges, setJoiningChallenges] = useState(new Set()); // State to track challenges being joined

  useEffect(() => {
    let keepLoading = true;
    
    async function loadData() {
      try {
        setState('loading');
        
        const currentUser = await User.me();
        setUser(currentUser);

        // Fetch available challenges
        const availableChallenges = await Challenge.filter({ isActive: true });
        
        const isPro = currentUser.plan === 'full';
        
        // Filter challenges based on user plan
        const visibleChallenges = availableChallenges.filter(challenge => {
          // Show all non-pro challenges to everyone
          if (!challenge.is_pro_only) return true;
          // Only show pro challenges to pro users
          return isPro;
        });
        
        // Sort: PERMANENT first, then COHORT, then by title
        const sorted = visibleChallenges.sort((a, b) => {
          if (a.kind === 'PERMANENT' && b.kind === 'COHORT') return -1;
          if (a.kind === 'COHORT' && b.kind === 'PERMANENT') return 1;
          return (a.title || '').localeCompare(b.title || '');
        });

        if (keepLoading) {
          setChallenges(sorted);
        }

        // Fetch user's participations
        const participations = await ChallengeParticipant.filter({ 
          created_by: currentUser.email 
        });
        
        if (keepLoading) {
          setMyParticipations(participations);
          setState('ready');
        }
      } catch (error) {
        console.error("Error loading challenges:", error);
        if (keepLoading) {
          setState('error');
        }
      }
    }

    loadData();
    
    // Listen for real-time updates from admin
    const handleChallengesUpdate = (event) => {
      if (event.detail && event.detail.challenges) {
        const activeOnly = event.detail.challenges.filter(c => c.isActive);
        const isPro = user?.plan === 'full';
        const visible = activeOnly.filter(c => !c.is_pro_only || isPro);
        const sorted = visible.sort((a, b) => {
          if (a.kind === 'PERMANENT' && b.kind === 'COHORT') return -1;
          if (a.kind === 'COHORT' && b.kind === 'PERMANENT') return 1;
          return (a.title || '').localeCompare(b.title || '');
        });
        setChallenges(sorted);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('challenges:updated', handleChallengesUpdate);
    }
    
    return () => {
      keepLoading = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('challenges:updated', handleChallengesUpdate);
      }
    };
  }, [user?.plan]); // Added user?.plan to dependency array for handleChallengesUpdate to be accurate

  const joinChallenge = async (challenge) => {
    try {
      // Check if already participating
      const existing = myParticipations.find(p => p.challenge_id === challenge.id);
      if (existing) {
        toast({
          title: "Already Participating",
          description: "You're already participating in this challenge!",
          variant: "destructive",
        });
        return;
      }

      // Set loading state for this specific challenge
      setJoiningChallenges(prev => new Set(prev).add(challenge.id));

      // Create participation
      const participation = await ChallengeParticipant.create({
        challenge_id: challenge.id,
        challenge_slug: challenge.slug,
        started_at: new Date().toISOString(),
        progress_percentage: 0,
        days_completed: 0,
        status: "active"
      });

      // Update participants count
      await Challenge.update(challenge.id, {
        participants_count: (challenge.participants_count || 0) + 1
      });

      // Update local state directly instead of full reload
      setMyParticipations(prev => [...prev, participation]);
      setChallenges(prev => prev.map(c => 
        c.id === challenge.id 
          ? { ...c, participants_count: (c.participants_count || 0) + 1 }
          : c
      ));

      // Dispatch gamification update
      window.dispatchEvent(new CustomEvent('gamification:update', {
        detail: {
          type: 'challenge_joined',
          challengeId: challenge.id,
          xpReward: challenge.xpReward // Assuming challenge object has xpReward
        }
      }));

      toast({
        title: "Challenge Joined!",
        description: `Successfully joined "${challenge.title}". Your XP will accrue as you check in.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Failed to Join",
        description: "Could not join challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear loading state for this specific challenge
      setJoiningChallenges(prev => {
        const next = new Set(prev);
        next.delete(challenge.id);
        return next;
      });
    }
  };

  const getChallengeStatus = (challenge) => {
    const participation = myParticipations.find(p => p.challenge_id === challenge.id);
    
    if (participation) {
      if (participation.status === 'completed') return 'completed';
      if (participation.status === 'active') return 'active';
    }

    // Check if cohort challenge has started/ended
    if (challenge.kind === 'COHORT') {
      const now = new Date();
      const start = challenge.start_date ? new Date(challenge.start_date) : null;
      const end = challenge.end_date ? new Date(challenge.end_date) : null;

      if (start && isBefore(now, start)) return 'upcoming';
      if (end && isAfter(now, end)) return 'ended';
    }

    return 'available';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    };
    return colors[difficulty] || colors.easy;
  };

  const isPro = user?.plan === 'full';

  // Loading state with skeleton
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  // Error state with retry
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Retry 
            onClick={() => window.location.reload()}
            message="Failed to load challenges. Please check your connection and try again."
          />
        </div>
      </div>
    );
  }

  // Separate challenges by kind
  const permanentChallenges = challenges.filter(c => c.kind === 'PERMANENT' && !c.is_pro_only);
  const cohortChallenges = challenges.filter(c => c.kind === 'COHORT' && !c.is_pro_only);
  
  // Separate Pro challenges
  const proChallenges = challenges.filter(c => c.is_pro_only);

  return (
    <AsyncBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Challenges
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Join challenges to push yourself and earn rewards
            </p>
          </motion.div>

          {/* My Active Challenges */}
          {myParticipations.filter(p => p.status === 'active').length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                My Active Challenges
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myParticipations
                  .filter(p => p.status === 'active')
                  .map((participation) => {
                    const challenge = challenges.find(c => c.id === participation.challenge_id);
                    if (!challenge) return null;

                    const daysRemaining = challenge.durationDays 
                      ? challenge.durationDays - participation.days_completed
                      : null;

                    return (
                      <motion.div
                        key={participation.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-500">
                          <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                              <CardTitle className="text-lg">{challenge.title}</CardTitle>
                              <Badge className="bg-blue-500 text-white">
                                Active
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {challenge.description}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-semibold">{Math.round(participation.progress_percentage)}%</span>
                              </div>
                              <Progress value={participation.progress_percentage} className="h-3" />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {participation.days_completed} / {challenge.durationDays || '∞'} days
                                </span>
                              </div>
                              {daysRemaining !== null && (
                                <span className="text-orange-600 font-medium">
                                  {daysRemaining} days left
                                </span>
                              )}
                            </div>

                            <Button 
                              className="w-full rounded-xl"
                              onClick={() => navigate(createPageUrl(`Challenge?id=${challenge.id}`))}
                            >
                              Continue Challenge
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Exclusive Pro Challenges Section */}
          {proChallenges.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Exclusive Pro Challenges
                </h2>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  Pro Only
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isPro 
                  ? "Premium challenges designed for our Pro members"
                  : "Upgrade to Pro to unlock exclusive challenges with higher rewards"}
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proChallenges.map((challenge, index) => {
                  const status = getChallengeStatus(challenge);
                  const participation = myParticipations.find(p => p.challenge_id === challenge.id);
                  const isJoining = joiningChallenges.has(challenge.id);

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`${isPro ? 'border-2 border-purple-500' : 'opacity-60'} shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col relative overflow-hidden`}>
                        {/* Pro badge overlay */}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        </div>
                        
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-lg pr-16">{challenge.title}</CardTitle>
                            <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge.description}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold">{challenge.xpReward * 2} XP</span> {/* Double XP for Pro */}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{challenge.participants_count || 0}</span>
                              </div>
                              {challenge.durationDays && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{challenge.durationDays} days</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {!isPro ? (
                            <Button 
                              onClick={() => navigate(createPageUrl('PremiumPortal'))}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to Unlock
                            </Button>
                          ) : status === 'active' && participation ? (
                            <Button 
                              className="w-full rounded-xl"
                              onClick={() => navigate(createPageUrl(`Challenge?id=${challenge.id}`))}
                            >
                              Continue ({Math.round(participation.progress_percentage)}%)
                            </Button>
                          ) : status === 'completed' ? (
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Completed
                            </Button>
                          ) : status === 'available' ? (
                            <Button 
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                              onClick={() => joinChallenge(challenge)}
                              disabled={isJoining}
                            >
                              {isJoining ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Joining...
                                </>
                              ) : (
                                <>
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Join Pro Challenge
                                </>
                              )}
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Permanent Challenges */}
          {permanentChallenges.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Infinity className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Evergreen Challenges
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Always available - start anytime at your own pace
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {permanentChallenges.map((challenge, index) => {
                  const status = getChallengeStatus(challenge);
                  const participation = myParticipations.find(p => p.challenge_id === challenge.id);
                  const isJoining = joiningChallenges.has(challenge.id); // Check if this challenge is currently being joined

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-lg">{challenge.title}</CardTitle>
                            <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge.description}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            {challenge.category && (
                              <Badge variant="outline" className="capitalize">
                                {challenge.category}
                              </Badge>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold">{challenge.xpReward} XP</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{challenge.participants_count || 0}</span>
                              </div>
                              {challenge.durationDays && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{challenge.durationDays} days</span>
                                </div>
                              )}
                            </div>

                            {challenge.daily_tasks && challenge.daily_tasks.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                                  Daily Tasks:
                                </p>
                                <ul className="space-y-1">
                                  {challenge.daily_tasks.slice(0, 3).map((task, i) => (
                                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                                      <span>{task}</span>
                                    </li>
                                  ))}
                                  {challenge.daily_tasks.length > 3 && (
                                    <li className="text-xs text-gray-500 dark:text-gray-400">
                                      +{challenge.daily_tasks.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          {status === 'active' && participation && (
                            <Button 
                              className="w-full rounded-xl"
                              onClick={() => navigate(createPageUrl(`Challenge?id=${challenge.id}`))}
                            >
                              Continue ({Math.round(participation.progress_percentage)}%)
                            </Button>
                          )}
                          
                          {status === 'completed' && (
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Completed
                            </Button>
                          )}
                          
                          {status === 'available' && (
                            <Button 
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
                              onClick={() => joinChallenge(challenge)}
                              disabled={isJoining} // Disable button when joining
                            >
                              {isJoining ? ( // Show loader when joining
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Joining...
                                </>
                              ) : (
                                <>
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Join Challenge
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cohort Challenges */}
          {cohortChallenges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Cohort Challenges
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Time-limited challenges - compete with others in a group
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cohortChallenges.map((challenge, index) => {
                  const status = getChallengeStatus(challenge);
                  const participation = myParticipations.find(p => p.challenge_id === challenge.id);
                  const isJoining = joiningChallenges.has(challenge.id); // Check if this challenge is currently being joined

                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={`shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col ${
                        status === 'upcoming' ? 'border-2 border-orange-500' : 
                        status === 'ended' ? 'opacity-60' : ''
                      }`}>
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <CardTitle className="text-lg">{challenge.title}</CardTitle>
                            <div className="flex flex-col gap-1">
                              <Badge className={getDifficultyColor(challenge.difficulty)} variant="outline">
                                {challenge.difficulty}
                              </Badge>
                              {status === 'upcoming' && (
                                <Badge className="bg-orange-500 text-white">
                                  Upcoming
                                </Badge>
                              )}
                              {status === 'ended' && (
                                <Badge variant="outline">
                                  Ended
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challenge.description}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            {challenge.start_date && challenge.end_date && (
                              <div className="text-sm">
                                <p className="text-gray-600 dark:text-gray-400 mb-1">
                                  {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                                </p>
                                {status === 'upcoming' && (
                                  <p className="text-orange-600 font-medium">
                                    Starts in {differenceInDays(new Date(challenge.start_date), new Date())} days
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold">{challenge.xpReward} XP</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{challenge.participants_count || 0}</span>
                              </div>
                              {challenge.durationDays && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>{challenge.durationDays} days</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {status === 'active' && participation && (
                            <Button 
                              className="w-full rounded-xl"
                              onClick={() => navigate(createPageUrl(`Challenge?id=${challenge.id}`))}
                            >
                              Continue ({Math.round(participation.progress_percentage)}%)
                            </Button>
                          )}
                          
                          {status === 'completed' && (
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl"
                              disabled
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              Completed
                            </Button>
                          )}
                          
                          {status === 'available' && (
                            <Button 
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl"
                              onClick={() => joinChallenge(challenge)}
                              disabled={isJoining} // Disable button when joining
                            >
                              {isJoining ? ( // Show loader when joining
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Joining...
                                </>
                              ) : (
                                <>
                                  <Trophy className="w-4 h-4 mr-2" />
                                  Join Cohort
                                </>
                              )}
                            </Button>
                          )}

                          {status === 'upcoming' && (
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl"
                              disabled
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Coming Soon
                            </Button>
                          )}

                          {status === 'ended' && (
                            <Button 
                              variant="outline"
                              className="w-full rounded-xl"
                              disabled
                            >
                              Challenge Ended
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <Card className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                No Challenges Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for new challenges!
              </p>
            </Card>
          )}
        </div>
      </div>
    </AsyncBoundary>
  );
}
