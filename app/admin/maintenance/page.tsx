import { redirect } from 'next/navigation';

/** Maintenance controls live in the developer panel only. */
export default function AdminMaintenanceRedirect() {
  redirect('/developer/maintenance');
}
