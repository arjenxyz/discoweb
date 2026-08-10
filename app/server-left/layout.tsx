import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/i18n.server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: t('server_left.badge'),
    description: t('server_left.body_1'),
  };
}

export default function ServerLeftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
