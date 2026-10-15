'use client';
import { use } from 'react';
import TaskDetail from '../../components/Tasks/Views/TaskDetail';

export default function TaskDetailPage({ params }) {
  const { id } = use(params);
  return <TaskDetail taskId={id} />;
}