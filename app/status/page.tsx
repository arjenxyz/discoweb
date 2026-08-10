import type { Metadata } from 'next';
import StatusPageClient from './StatusPageClient';
import { getServerTranslation } from '@/lib/i18n.server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return {
    title: 'DiscoWeb Status',
    description: t('status.meta_description'),
  };
}

export default function StatusPage() {
  return <StatusPageClient />;
}
