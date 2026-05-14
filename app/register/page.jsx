'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);

    try {
     const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        setLoading(false);
        return;
      }

      // Token aur user save karo
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Chat page pe redirect
      router.push('/login');

    } catch (err) {
      setError('Server se connection nahi ho raha');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 font-sans text-[#1d1c1d]">

      <div className="mb-4 mt-6 flex items-center justify-center cursor-pointer">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg"
          alt="Slack Logo"
          className="h-10 w-10 mr-2"
        />
        <span className="text-3xl font-black tracking-tighter">slack</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-[48px] font-bold leading-tight mb-2">
          First, enter your email
        </h1>
        <p className="text-[18px] text-[#454245]">
          We suggest using the work email address you use at home.
        </p>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-[400px]">

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-3 border border-gray-400 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
        />

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
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-400 rounded-lg text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
        />

        <div className="flex items-start gap-3 mb-6">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300"
          />
          <p className="text-sm text-gray-600">
            By continuing, you're agreeing to our Customer Terms of Service, User Terms of Service, Privacy Policy, and Cookie Policy.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4a154b] text-white font-bold py-3 px-4 rounded-lg text-[18px] hover:bg-[#5d1c5e] transition-colors mb-6 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Continue'}
        </button>

      </form>

      <div className="absolute top-8 right-8 text-sm">
        <span className="text-gray-500 mr-1">Already using Slack?</span>
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
          Sign in to an existing workspace
        </Link>
      </div>

    </div>
  );
};

export default RegisterPage;