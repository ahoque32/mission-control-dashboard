import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents | Mission Control',
  description: 'Browse and manage documents, deliverables, research, and protocols in Mission Control',
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
