import StatusPageClient from './StatusPageClient';

export const metadata = {
  title: 'DiscoWeb Status',
  description: 'DiscoWeb sistem durumu, servis çalışma süreleri ve olay geçmişi.',
};

export default function StatusPage() {
  return <StatusPageClient />;
}
