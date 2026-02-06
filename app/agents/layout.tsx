import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents | Mission Control',
  description: 'Monitor and manage AI agents, their status, workload, and activity in Mission Control',
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
