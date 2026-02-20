import { motion } from 'framer-motion';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Lock, Mail } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) navigate("/dashboard");
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 flex pb-safe">
            {/* Left Panel - Visual/Brand (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-1 relative bg-[#05080c] border-r border-white/5 p-12 flex-col justify-between overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyber-primary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgNDBMMDAgMEw0MCAwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4=')] opacity-50 z-0" />

                <div className="relative z-10 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-cyber-primary" />
                    <span className="text-2xl font-bold tracking-tight text-white">Fraud<span className="text-cyber-primary">Sense</span></span>
                </div>

                <div className="relative z-10 max-w-lg mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                            Welcome back to your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyber-primary">defense matrix.</span>
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            Access your real-time network graphs, ML calibrations, and SHAP analyses.
                        </p>
                    </motion.div>

                    {/* Testimonial Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl backdrop-blur-md"
                    >
                        <div className="flex gap-1 mb-4">
                            {[...Array(5)].map((_, i) => <span key={i} className="text-cyber-primary text-sm">★</span>)}
                        </div>
                        <p className="text-gray-300 italic mb-4">"The 4-layer engine has practically eliminated manual review for our risk operations team."</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-sm">MR</div>
                            <div>
                                <p className="text-sm font-medium text-white">Michael Ross</p>
                                <p className="text-xs text-gray-500">VP of Risk, FinTech Global</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile Logo */}
                    <div className="flex lg:hidden items-center justify-center gap-2 mb-12">
                        <Shield className="w-8 h-8 text-cyber-primary" />
                        <span className="text-3xl font-bold tracking-tight text-white">Fraud<span className="text-cyber-primary">Sense</span></span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold mb-2">Sign in</h2>
                        <p className="text-gray-400">Continue building your secure network.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#0a0f16] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-colors"
                                    required
                                />
                                <Mail className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#0a0f16] border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary/50 transition-colors"
                                    required
                                />
                                <Lock className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-sm">
                            <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300">
                                <input type="checkbox" className="rounded border-gray-800 bg-[#0a0f16] text-cyber-primary focus:ring-cyber-primary focus:ring-offset-[#030712]" />
                                Remember me
                            </label>
                            <a href="#" className="font-medium text-cyber-primary hover:text-cyber-primary/80 transition-colors">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="my-8 flex items-center">
                        <div className="flex-1 border-t border-gray-800"></div>
                        <span className="px-4 text-sm text-gray-500">Or continue with</span>
                        <div className="flex-1 border-t border-gray-800"></div>
                    </div>

                    <div className="space-y-3">
                        <GoogleLoginButton />
                    </div>

                    <p className="text-center text-sm text-gray-400 mt-8">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-white font-medium hover:text-cyber-primary transition-colors">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}