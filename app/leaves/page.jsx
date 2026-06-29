'use client';

import { useState, useEffect } from 'react';
import MyLeaves from "../components/Attendance/MyLeaves";
import AdminLeaves from "../components/Attendance/AdminLeaves";

export default function LeavePage() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRole(user.role);
  }, []);

  if (role === null) return null; // loading

  return role === 'admin' ? <AdminLeaves /> : <MyLeaves />;
}