import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kimi Portal — Mission Control',
  description: 'Chief Operator powered by Kimi K2.5',
};

export default function KimiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
