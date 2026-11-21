"use client";

import { SupportView } from "@/components/dashboard/SupportView";
import { useTickets } from "@/components/dashboard/providers/tickets";
import { useNotifications } from "@/components/dashboard/providers/notifications";

export default function SoportePage() {
  const { tickets, setTickets } = useTickets();
  const { notify } = useNotifications();
  return <SupportView tickets={tickets} setTickets={setTickets} onNotify={notify} />;
}
