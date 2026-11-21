"use client";

import { SettingsView } from "@/components/dashboard/SettingsView";
import { useNotifications } from "@/components/dashboard/providers/notifications";

export default function ConfiguracionPage() {
  const { notify } = useNotifications();
  return <SettingsView onNotify={notify} />;
}
