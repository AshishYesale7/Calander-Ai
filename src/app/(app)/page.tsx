
'use client';

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
