import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles,LogIn, User as UserIcon } from 'lucide-react';

export default function WelcomePage() {
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            await User.login();
        } catch (error) {
            console.error("Login failed:", error);
            // Optionally show a toast or error message to the user
        }
    };
    
    const handleGuest = () => {
        // Set a flag to indicate guest mode
        sessionStorage.setItem('guestMode', 'true');
        navigate(createPageUrl('Dashboard'));
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-full max-w-md text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 md:p-12"
            >
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-green-500 rounded-3xl flex items-center justify-center shadow-lg logo rotate-45">
                  <Sparkles className="w-10 h-10 text-white -rotate-45" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    Welcome to GrowthPath
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Your personal journey to self-improvement and well-being starts now.
                </p>
                <div className="space-y-4">
                    <Button
                        size="lg"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg shadow-lg"
                        onClick={handleLogin}
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Login / Sign Up
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        className="w-full rounded-xl text-lg"
                        onClick={handleGuest}
                    >
                        <UserIcon className="w-5 h-5 mr-2" />
                        Continue as Guest
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}