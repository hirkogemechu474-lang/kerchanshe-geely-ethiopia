import { redirect } from 'next/navigation';

export default function FinancingSettingsRedirect() {
  redirect('/admin/financing?tab=settings');
}
