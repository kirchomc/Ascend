import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";

const proFeatures = [
  "Unlimited habits tracking",
  "Unlimited goals",
  "Unlimited journal entries with search",
  "All challenges unlocked",
  "Notes on check-ins",
  "Advanced analytics",
  "Priority support"
];

export default function UpgradePrompt({ feature }) {
  return (
    <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Crown className="w-6 h-6 text-yellow-600" />
          Upgrade to Pro
        </CardTitle>
        <p className="text-gray-600 dark:text-gray-400">
          {feature ? `Unlock ${feature} and more` : "Unlock all features"}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {proFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-xl text-lg py-6">
          <Crown className="w-5 h-5 mr-2" />
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}