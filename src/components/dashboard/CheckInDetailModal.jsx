import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";

export default function CheckInDetailModal({ open, onClose, checkIn, streak, totalCheckIns, allCheckIns }) {
  const [selectedDate, setSelectedDate] = useState(checkIn?.date ? new Date(checkIn.date) : new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const moods = {
    very_sad: { emoji: "😞", label: "Very Sad", color: "bg-red-100 text-red-800" },
    sad: { emoji: "😐", label: "Sad", color: "bg-orange-100 text-orange-800" },
    neutral: { emoji: "🙂", label: "Okay", color: "bg-yellow-100 text-yellow-800" },
    happy: { emoji: "😃", label: "Happy", color: "bg-green-100 text-green-800" },
    very_happy: { emoji: "🤩", label: "Amazing", color: "bg-emerald-100 text-emerald-800" }
  };

  // Get check-in for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedCheckIn = allCheckIns?.find(c => c.date === selectedDateStr);
  const selectedMoodData = selectedCheckIn ? moods[selectedCheckIn.mood] : null;

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getCheckInForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allCheckIns?.find(c => c.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentMonth(subDays(currentMonth, 30));
  };

  const nextMonth = () => {
    setCurrentMonth(addDays(currentMonth, 30));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-500" />
            Check-In History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCheckIns}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Check-ins</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCheckIn?.points_earned || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Points Earned</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => {
                  const dayCheckIn = getCheckInForDate(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const moodData = dayCheckIn ? moods[dayCheckIn.mood] : null;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      disabled={!isCurrentMonth}
                      className={`aspect-square p-1 rounded-lg text-sm transition-all ${
                        !isCurrentMonth
                          ? 'text-gray-300 dark:text-gray-700'
                          : isSelected
                          ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300'
                          : dayCheckIn
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span>{format(day, 'd')}</span>
                        {moodData && <span className="text-xs">{moodData.emoji}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                {selectedCheckIn ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mood</p>
                      <Badge className={`${selectedMoodData.color} border-0 text-lg px-4 py-2`}>
                        {selectedMoodData.emoji} {selectedMoodData.label}
                      </Badge>
                    </div>

                    {selectedCheckIn.habits_completed && selectedCheckIn.habits_completed.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Habits Completed</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCheckIn.habits_completed.map((habitId, i) => (
                            <Badge key={i} variant="outline" className="bg-white dark:bg-gray-800">
                              ✓ Habit {i + 1}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedCheckIn.notes && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg">
                          {selectedCheckIn.notes}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Points Earned</p>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">
                        ⭐ {selectedCheckIn.points_earned || 10} points
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No check-in for this day</p>
                  </div>
                )}
              </div>
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