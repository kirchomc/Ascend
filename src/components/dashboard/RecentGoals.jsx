import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, CheckCircle, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toggleGoalCompletion, useGamificationUpdates } from "@/components/utils/gamification";
import { User } from "@/api/entities";

export default function RecentGoals({ goals, onRefresh }) {
  const [isUpdating, setIsUpdating] = React.useState({});

  useGamificationUpdates((payload) => {
    if (payload.type === 'goal_completed' || payload.type === 'goal_uncompleted' || payload.type === 'checkin_completed') {
      onRefresh();
    }
  });

  const toggleGoalComplete = async (goal) => {
    setIsUpdating({ ...isUpdating, [goal.id]: true });
    
    try {
      const currentUser = await User.me();
      const result = await toggleGoalCompletion(goal.id, goal.completed, currentUser.email);
      
      if (result.success) {
        console.log(`✅ Goal ${goal.completed ? 'uncompleted' : 'completed'}!`);
      } else {
        console.error('Error toggling goal:', result.error);
      }
      onRefresh();
    } catch (error) {
      console.error("Error toggling goal:", error);
    } finally {
      setIsUpdating({ ...isUpdating, [goal.id]: false });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleGoalComplete(goal)}
                    className="flex-shrink-0"
                    disabled={isUpdating[goal.id]}
                  >
                    {isUpdating[goal.id] ? (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : goal.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className={`font-medium ${goal.completed && 'line-through text-gray-500'}`}>
                      {goal.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {goal.type}
                      </Badge>
                      {goal.category && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {goal.category}
                        </Badge>
                      )}
                      {goal.due_date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {format(new Date(goal.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No active goals yet. Create your first goal to get started!
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}