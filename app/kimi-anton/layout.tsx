import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kimi Portal Anton — Mission Control',
  description: 'Chief Operator powered by Kimi K2.5 — Anton Commander Instance',
};

export default function KimiAntonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
