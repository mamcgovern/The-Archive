import { useState } from "react";
import { BookOpen, Library } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError("");
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("We couldn't sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand-icon">
          <Library size={30} />
        </div>

        <p className="login-eyebrow">YOUR HOUSEHOLD LIBRARY</p>
        <h1>The Archive</h1>
        <p className="login-description">
          Everything you own, all in one place.
        </p>

        <div className="login-divider" />

        <h2>Welcome back</h2>
        <p className="login-instructions">
          Sign in with Google to access your shared collection.
        </p>

        <button
          className="google-sign-in-button"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
          />
          {submitting ? "Signing in..." : "Continue with Google"}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-footer">
          <BookOpen size={14} />
          Made for the things you love to collect.
        </p>
      </div>
    </main>
  );
}

export default Login;