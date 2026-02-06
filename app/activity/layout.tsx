import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Activity Feed | Mission Control',
  description: 'Real-time activity feed from all agents and operations in Mission Control',
};

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
