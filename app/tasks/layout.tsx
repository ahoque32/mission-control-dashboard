import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasks | Mission Control',
  description: 'Kanban board for managing tasks and assignments in Mission Control',
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
