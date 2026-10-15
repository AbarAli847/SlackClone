'use client';
import { use } from 'react';
import ProjectOverview from '../../../components/Tasks/Views/ProjectOverview';

export default function ProjectOverviewPage({ params }) {
  const { id } = use(params);
  return <ProjectOverview projectId={id} />;
}