import React from "react";
import { format, subDays, startOfDay } from "date-fns";

export default function ActivityHeatmap({ checkIns }) {
  const days = 30;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = format(subDays(startOfDay(new Date()), i), 'yyyy-MM-dd');
    const checkIn = checkIns.find(c => c.date === date);
    data.push({
      date,
      hasCheckIn: !!checkIn,
      mood: checkIn?.mood
    });
  }

  const getMoodColor = (mood) => {
    const colors = {
      very_sad: 'bg-red-400',
      sad: 'bg-orange-400',
      neutral: 'bg-yellow-400',
      happy: 'bg-green-400',
      very_happy: 'bg-emerald-500'
    };
    return colors[mood] || 'bg-gray-200 dark:bg-gray-700';
  };

  return (
    <div className="flex flex-wrap gap-1">
      {data.map((day, index) => (
        <div
          key={index}
          title={`${day.date}${day.hasCheckIn ? ` - ${day.mood}` : ' - No check-in'}`}
          className={`w-3 h-3 rounded-sm transition-all hover:scale-125 ${
            day.hasCheckIn ? getMoodColor(day.mood) : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}