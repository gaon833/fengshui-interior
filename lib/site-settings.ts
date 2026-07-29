import defaults from "@/content/site.json";

export type SiteSettings = typeof defaults & {
  company?: { name: string; representative: string; email: string };
  seo: typeof defaults.seo & { keywords?: string; favicon?: string };
};

export const SITE_SETTINGS_KEY = "fengshui-site-settings-v31";
export const SITE_SETTINGS_EVENT = "fengshui-site-settings-updated";
export const defaultSiteSettings = defaults as SiteSettings;

export function mergeSiteSettings(value?: Partial<SiteSettings> | null): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...(value || {}),
    contact: { ...defaultSiteSettings.contact, ...(value?.contact || {}) },
    seo: { ...defaultSiteSettings.seo, ...(value?.seo || {}) },
    admin: { ...defaultSiteSettings.admin, ...(value?.admin || {}) },
    company: {
      name: defaultSiteSettings.brandName,
      representative: "",
      email: "",
      ...(value?.company || {}),
    },
  };
}
