
'use client';

// This page is intentionally left blank to resolve a route conflict.
// Navigation should go directly to /dashboard for authenticated users.
// We need to pass props down to the dashboard page, so this component handles that.
import DashboardPage from './dashboard/page';

export default function AppRoot(props: any) {
  return <DashboardPage {...props} />;
}
