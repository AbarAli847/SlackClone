"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      // Token aur user save karo
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Chat page pe redirect
     if (data.user.role === 'admin') {
  router.push("/admin/leaves"); // ya jo bhi admin route hai
} else {
  router.push("/chats");
}
    } catch (err) {
      setError("Server se connection nahi ho raha");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 font-sans text-[#1d1c1d]">
      <div className="mb-3 mt-5 flex items-center justify-center">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg"
          alt="Slack Logo"
          className="h-10 w-10 mr-2"
        />
        <span className="text-3xl font-black tracking-tighter">slack</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[48px] font-bold leading-tight mb-2">
          Enter your email to sign in
        </h1>
        <p className="text-[18px] text-[#454245]">
          Or choose another way to sign in.
        </p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-[400px]">
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
            {error === "Invalid email or password" && (
              <span className="ml-1">
                —{" "}
                <a
                  href="/register"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Register karo
                </a>
              </span>
            )}
          </div>
        )}

        <input
          type="email"
          placeholder="name@work-email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 border border-gray-400 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
        />

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-400 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4a154b] text-white font-bold py-3 px-4 rounded-lg text-[18px] hover:bg-[#5d1c5e] transition-colors mb-3 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In With Email"}
        </button>

        <div className="flex items-center my-3">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-4 text-sm font-semibold text-gray-500">
            OR SIGN IN WITH
          </span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            type="button"
            className="flex-1 flex items-center justify-center border-2 border-gray-300 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="h-5 w-5 mr-3"
            />
            Google
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center border-2 border-gray-300 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            <svg
              className="h-5 w-5 mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.044-.156-3.33 1.04-4.303 1.04zM15.19 3.778c.857-1.04 1.442-2.48 1.287-3.91-1.221.052-2.704.819-3.587 1.846-.78.896-1.469 2.39-1.287 3.78 1.35.104 2.73-.676 3.587-1.716z" />
            </svg>
            Apple
          </button>
        </div>
      </form>

      <div className="absolute top-8 right-8 text-sm">
        <span className="text-gray-500 mr-1">New to Slack?</span>
        <a href="/register" className="text-blue-600 font-bold hover:underline">
          Create an account
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
