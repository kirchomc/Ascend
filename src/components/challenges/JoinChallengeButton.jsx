import React, { useState } from "react";
import { ChallengeParticipant } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";

export default function JoinChallengeButton({ challenge, isJoined, onJoinSuccess }) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      await ChallengeParticipant.create({
        challenge_id: challenge.id,
        challenge_slug: challenge.slug || challenge.title?.toLowerCase().replace(/\s+/g, '-'),
        started_at: new Date().toISOString(),
        progress_percentage: 0,
        days_completed: 0,
        status: 'active'
      });

      toast.success(`Joined ${challenge.title}! Complete it to earn ${challenge.xpReward || 100} XP 🎉`);
      
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast.error("Failed to join challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (participantId) => {
    setIsLoading(true);
    try {
      // Mark challenge as completed (XP awarded by backend trigger)
      await ChallengeParticipant.update(participantId, {
        completed_at: new Date().toISOString(),
        progress_percentage: 100,
        status: 'completed'
      });

      toast.success(`Challenge completed! Earned ${challenge.xpReward || 100} XP! 🏆`);
      
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast.error("Failed to complete challenge. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isJoined && isJoined.status === 'active') {
    return (
      <Button
        onClick={() => handleComplete(isJoined.id)}
        disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Completing...
          </>
        ) : (
          'Mark as Complete'
        )}
      </Button>
    );
  }

  if (isJoined && isJoined.status === 'completed') {
    return (
      <Button
        disabled
        className="w-full rounded-xl bg-gray-400 cursor-not-allowed"
      >
        ✓ Completed
      </Button>
    );
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading}
      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Joining...
        </>
      ) : (
        'Join Challenge'
      )}
    </Button>
  );
}