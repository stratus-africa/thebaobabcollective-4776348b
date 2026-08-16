import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  DEFAULT_CURRENCY,
  getSiteSettings,
  resolveCurrencySettings,
  type SiteSettings,
} from "@/lib/site-settings.functions";

const FALLBACK_EMAIL = "info@thebaobabcollective.co.uk";
const FALLBACK_PHONE = "+44 (0) 20 0000 0000";

export const SITE_SETTINGS_QUERY_KEY = ["site-settings"] as const;

export function useSiteSettings() {
  const fetchSettings = useServerFn(getSiteSettings);
  const query = useQuery<SiteSettings>({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });
  const s = query.data;
  const email = s?.contact?.email || FALLBACK_EMAIL;
  const phone = s?.contact?.phone || FALLBACK_PHONE;
  const phoneTel = s?.contact?.phone_tel || phone.replace(/[^\d+]/g, "");
  const currency = resolveCurrencySettings(s?.currency ?? DEFAULT_CURRENCY);
  const currencyCode = currency.code;
  const currencySymbol = currency.symbol;
  return {
    settings: s,
    email,
    phone,
    phoneTel,
    address: s?.contact?.address ?? "",
    logoUrl: s?.branding?.logo_url ?? "",
    currencyCode,
    currencySymbol,
    formatPrice: (amount: number | null | undefined) =>
      amount == null ? "—" : `${currencySymbol}${Number(amount).toLocaleString()}`,
    isLoading: query.isLoading,
  };
}
