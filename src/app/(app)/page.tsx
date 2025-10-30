
'use client';

// This page is intentionally left blank to resolve a route conflict.
// Navigation should go directly to /dashboard for authenticated users.
// We need to pass props down to the dashboard page, so this component handles that.
import DashboardPage from './dashboard/page';

interface AppRootProps {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  hiddenWidgets: Set<string>;
  handleToggleWidget: (id: string) => void;
}

export default function AppRoot(props: AppRootProps) {
  return <DashboardPage {...props} />;
}
