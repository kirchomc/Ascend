import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Send, CheckCircle, Clock, MessageSquare, Sparkles, Shield } from "lucide-react";

export default function ProSupportPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    category: "general",
    subject: "",
    message: ""
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      if (currentUser.plan !== 'full') {
        navigate(createPageUrl('PremiumPortal'));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      return;
    }

    setSubmitting(true);
    try {
      // Send email to support
      await SendEmail({
        from_name: "GrowthPath Pro Support",
        to: "support@growthpath.app",
        subject: `[PRO SUPPORT] ${formData.category.toUpperCase()}: ${formData.subject}`,
        body: `
Pro Support Request

From: ${user.display_name || user.full_name} (${user.email})
Plan: Pro Member since ${user.plan_upgraded_date || 'Unknown'}
Category: ${formData.category}
Subject: ${formData.subject}

Message:
${formData.message}

---
This is a priority support request from a Pro member.
        `
      });

      setSubmitted(true);
      setFormData({ category: "general", subject: "", message: "" });
      
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
      
    } catch (error) {
      console.error("Error submitting support request:", error);
      alert("Failed to submit request. Please try again or email support@growthpath.app directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Priority Support
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro Member
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
                  <Clock className="w-3 h-3 mr-1" />
                  24-48h Response
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Get priority assistance from our support team
          </p>
        </motion.div>

        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-200">
                <strong>Request Submitted!</strong> Our priority support team will respond within 24-48 hours.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2 dark:text-white">Priority Queue</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your requests are handled first</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2 dark:text-white">Fast Response</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">24-48 hour response time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2 dark:text-white">Dedicated Help</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Expert guidance & solutions</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Submit Support Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="general" className="dark:text-white">General Question</SelectItem>
                    <SelectItem value="technical" className="dark:text-white">Technical Issue</SelectItem>
                    <SelectItem value="billing" className="dark:text-white">Billing & Account</SelectItem>
                    <SelectItem value="feature" className="dark:text-white">Feature Request</SelectItem>
                    <SelectItem value="bug" className="dark:text-white">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  className="rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail. Include any steps to reproduce if it's a bug."
                  className="rounded-xl h-40 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting || !formData.subject || !formData.message}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Priority Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <h3 className="font-semibold mb-2 dark:text-white">Need Immediate Help?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            For urgent issues, you can also email us directly at{" "}
            <a href="mailto:support@growthpath.app" className="text-purple-600 dark:text-purple-400 hover:underline">
              support@growthpath.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}