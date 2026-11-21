import { SaasPage } from "@/features/mod_saas";
import { BillingSummary } from "@/features/mod_billing";

/**
 * Consola SaaS del superadmin. La vista vive en `features/mod_saas` y la sección de
 * facturación en `features/mod_billing`; la ruta solo las compone para conservar el
 * layout raíz y el guard de `proxy.ts`.
 */
export default function SaasRoute() {
  return <SaasPage billing={<BillingSummary />} />;
}
