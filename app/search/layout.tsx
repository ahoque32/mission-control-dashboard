import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Mission Control',
  description: 'Search across all tasks, activities, and documents in Mission Control',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
