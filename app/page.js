'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from "./components/Dashboard";

export default function Home() {
  const router = useRouter();

    
  const [checked, setChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setHasToken(true);
    }
    setChecked(true);
  }, []);

  
  if (!checked || !hasToken) return null;

  return <Dashboard />;
}