import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { WeeklyChallenge } from "@/api/entities";
import { WeeklyChallengeParticipant } from "@/api/entities";
import { PointsLedger } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  TrendingUp,
  Users,
  Star,
  Medal,
  Crown,
  Flame,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function WeeklyChallengesPage() {
  const [user, setUser] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [myParticipation, setMyParticipation] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWeeklyChallenge();
  }, []);

  const loadWeeklyChallenge = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const challenges = await WeeklyChallenge.filter({ week_start: weekStart, is_active: true });
      
      if (challenges.length > 0) {
        const challenge = challenges[0];
        setCurrentChallenge(challenge);

        const participation = await WeeklyChallengeParticipant.filter({
          created_by: currentUser.email,
          challenge_id: challenge.id
        });
        
        if (participation.length > 0) {
          setMyParticipation(participation[0]);
        }

        const allParticipants = await WeeklyChallengeParticipant.filter(
          { challenge_id: challenge.id },
          '-points',
          50
        );
        setLeaderboard(allParticipants);
      }
    } catch (error) {
      console.error("Error loading weekly challenge:", error);
      setError("Could not load weekly challenge");
    }
  };

  const joinChallenge = async () => {
    setError(null);
    
    try {
      const displayName = user.full_name || "Anonymous";
      
      await WeeklyChallengeParticipant.create({
        created_by: user.email,
        challenge_id: currentChallenge.id,
        points: 0,
        streak: 0,
        rank: leaderboard.length + 1,
        display_name: displayName,
        progress_percentage: 0,
        status: "active"
      });

      await PointsLedger.create({
        created_by: user.email,
        action: "joined_weekly_challenge",
        points: 10,
        related_entity_type: "weekly_challenge",
        related_entity_id: currentChallenge.id,
        description: "Joined this week's challenge"
      });

      loadWeeklyChallenge();
    } catch (error) {
      console.error("Error joining challenge:", error);
      setError("Could not join challenge. Try again.");
    }
  };

  const leaveChallenge = async () => {
    if (!myParticipation) return;
    
    try {
      await WeeklyChallengeParticipant.update(myParticipation.id, {
        status: "left"
      });
      
      setMyParticipation(null);
      loadWeeklyChallenge();
    } catch (error) {
      console.error("Error leaving challenge:", error);
      setError("Could not leave challenge");
    }
  };

  const isLitePlan = user?.plan === "lite" || !user?.plan;
  const weeklyPointsCap = isLitePlan ? 250 : 999999;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            This Week's Challenge
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Compete with the community and earn points
            {isLitePlan && ` (${weeklyPointsCap} points max on Lite)`}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLitePlan && myParticipation && myParticipation.points >= weeklyPointsCap && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <Crown className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              You've hit the weekly points cap. Go Pro to remove limits!
            </AlertDescription>
          </Alert>
        )}

        {currentChallenge ? (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white border-none">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2">{currentChallenge.title}</h2>
                      <p className="text-white/90 mb-4">
                        {format(new Date(currentChallenge.week_start), 'MMM d')} - {format(new Date(currentChallenge.week_end), 'MMM d, yyyy')}
                      </p>
                      <p className="text-lg text-white/90 mb-6">
                        {currentChallenge.description}
                      </p>
                      
                      {currentChallenge.rules && currentChallenge.rules.length > 0 && (
                        <div className="mb-6">
                          <h3 className="font-semibold mb-2">Rules:</h3>
                          <ul className="space-y-1">
                            {currentChallenge.rules.map((rule, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Star className="w-4 h-4 mt-1 flex-shrink-0" />
                                <span className="text-white/90">{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentChallenge.points_formula && (
                        <div className="p-4 bg-white/10 rounded-xl">
                          <p className="text-sm font-medium">Points Formula:</p>
                          <p className="text-white/90">{currentChallenge.points_formula}</p>
                        </div>
                      )}
                    </div>
                    <Trophy className="w-16 h-16 text-yellow-300" />
                  </div>

                  <Button
                    size="lg"
                    onClick={myParticipation ? leaveChallenge : joinChallenge}
                    className={`w-full ${
                      myParticipation
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-white text-purple-600 hover:bg-gray-100'
                    } rounded-xl`}
                  >
                    {myParticipation ? 'Leave Challenge' : 'Join Challenge'}
                    {!myParticipation && <ArrowRight className="w-5 h-5 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {myParticipation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      Your Progress This Week
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-500 mb-1">
                          {myParticipation.points}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Points</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-1">
                          #{myParticipation.rank || '-'}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Rank</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-500 mb-1 flex items-center justify-center gap-2">
                          <Flame className="w-8 h-8" />
                          {myParticipation.streak}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Weekly Progress</span>
                        <span className="font-semibold">{myParticipation.progress_percentage || 0}%</span>
                      </div>
                      <Progress value={myParticipation.progress_percentage || 0} className="h-3" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Top performers this week
                  </p>
                </CardHeader>
                <CardContent>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard.map((participant, index) => {
                        const isCurrentUser = participant.created_by === user?.email;
                        const medals = ['🥇', '🥈', '🥉'];
                        
                        return (
                          <motion.div
                            key={participant.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                              isCurrentUser
                                ? 'bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-2 border-blue-200 dark:border-blue-800'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {index < 3 ? medals[index] : `#${index + 1}`}
                            </div>
                            <div className="flex-1">
                              <p className={`font-semibold ${isCurrentUser && 'text-blue-600 dark:text-blue-400'}`}>
                                {participant.display_name || 'Anonymous'}
                                {isCurrentUser && ' (You)'}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  {participant.points} points
                                </span>
                                <span className="flex items-center gap-1">
                                  <Flame className="w-4 h-4 text-orange-500" />
                                  {participant.streak} day streak
                                </span>
                              </div>
                            </div>
                            {index < 3 && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-0">
                                <Medal className="w-3 h-3 mr-1" />
                                Top 3
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Be the first to join this week's challenge!
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                No active challenge this week
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Check back soon for the next weekly challenge!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}