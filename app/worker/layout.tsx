import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solid Workers',
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
