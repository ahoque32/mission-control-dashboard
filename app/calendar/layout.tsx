import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendar | Mission Control',
  description: 'Weekly calendar view of scheduled cron jobs and automated tasks',
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
