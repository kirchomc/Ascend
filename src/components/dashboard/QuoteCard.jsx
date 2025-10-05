import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" }
];

export default function QuoteCard() {
  const [quote, setQuote] = useState(quotes[0]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Change quote on mount - rotates every time dashboard is visited
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomIndex]);
    setKey(prev => prev + 1);
  }, []); // Only on mount to get new quote each time component loads

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 text-white border-none shadow-xl">
        <CardContent className="p-8">
          <Sparkles className="w-8 h-8 mb-4 animate-pulse" />
          <blockquote className="text-xl md:text-2xl font-medium mb-4 leading-relaxed">
            "{quote.text}"
          </blockquote>
          <p className="text-white/80 font-medium">— {quote.author}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}