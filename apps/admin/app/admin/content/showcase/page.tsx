import { redirect } from 'next/navigation';

// Retain old bookmarks while consolidating showcase controls under Vehicles.
export default function ShowcaseManagementPage() {
  redirect('/admin/vehicles/settings#sec-360');
}
