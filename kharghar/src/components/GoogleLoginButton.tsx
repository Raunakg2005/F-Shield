import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function GoogleLoginButton() {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  return (
    <button 
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-3 bg-white text-cyber-dark py-3 rounded-lg hover:bg-gray-100 transition"
    >
      {/* Google SVG remains same */}
      Continue with Google
    </button>
  );
}