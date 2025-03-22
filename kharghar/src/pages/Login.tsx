// src/pages/Login.tsx
import { motion } from 'framer-motion';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function Login() {
  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cyber-primary/10 p-8 rounded-xl border border-cyber-primary/20 w-96"
      >
        <h2 className="text-3xl font-bold text-cyber-primary mb-8">Sign In</h2>
        
        <GoogleLoginButton />
        
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-cyber-primary/20"></div>
          <span className="px-4 text-cyber-primary/80">or</span>
          <div className="flex-1 border-t border-cyber-primary/20"></div>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-cyber-primary mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
            />
          </div>
          
          <div>
            <label className="block text-cyber-primary mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 text-cyber-primary"
            />
          </div>

          <button className="w-full bg-cyber-primary text-cyber-dark py-3 rounded-lg hover:bg-cyber-primary/90 transition">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
}