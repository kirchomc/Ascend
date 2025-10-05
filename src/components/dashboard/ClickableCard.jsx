import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function ClickableCard({ children, onClick, className = "" }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card 
        className={`cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 relative group ${className}`}
        onClick={onClick}
      >
        {children}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-500 text-white rounded-full p-1">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}