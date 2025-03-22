// src/pages/Signup.tsx
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldAlert } from 'lucide-react';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { Link } from 'react-router-dom';
import { useState as reactUseState } from 'react';

function useState<T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    return reactUseState(initialValue);
}

export default function Signup() {
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const calculatePasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add your signup logic here
    };

    return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-cyber-dark-secondary p-8 rounded-xl border border-cyber-primary/20 w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <ShieldAlert className="w-12 h-12 text-cyber-primary mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-cyber-primary mb-2">
                        Create Secure Account
                    </h2>
                    <p className="text-cyber-primary/80">
                        Protect your business from financial fraud
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-cyber-primary mb-2 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
                            placeholder="John Doe"
                        />
                        {errors.name && <p className="text-cyber-alert text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-cyber-primary mb-2 flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
                            placeholder="secure@business.com"
                        />
                        {errors.email && <p className="text-cyber-alert text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-cyber-primary mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
                            placeholder="••••••••"
                            onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
                        />
                        <div className="mt-2 flex gap-1">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full ${
                                        i < passwordStrength ? 'bg-cyber-primary' : 'bg-cyber-primary/20'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-cyber-primary mb-2 flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="text-cyber-alert text-sm mt-1">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-cyber-primary text-cyber-dark py-3 rounded-lg font-semibold
                            hover:bg-cyber-primary/90 transition-colors"
                    >
                        Create Secure Account
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-cyber-primary/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-cyber-dark-secondary text-cyber-primary/80">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <GoogleLoginButton />
                        <button
                            type="button"
                            className="w-full flex items-center justify-center gap-3 bg-gray-900 text-cyber-primary py-3 rounded-lg
                                hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    <p className="text-center text-cyber-primary/80 text-sm">
                        Already have an account?{' '}
                        <Link 
                            to="/login" 
                            className="text-cyber-primary hover:text-cyber-primary/90 underline"
                        >
                            Sign in here
                        </Link>
                    </p>

                    <p className="text-center text-cyber-primary/60 text-xs mt-6">
                        By continuing, you agree to our{' '}
                        <a href="#" className="hover:text-cyber-primary underline">Terms of Service</a> and{' '}
                        <a href="#" className="hover:text-cyber-primary underline">Privacy Policy</a>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}

