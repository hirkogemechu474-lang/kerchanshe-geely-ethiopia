import { serverApiClient } from "@/lib/serverApiClient";

// Each CMS "Setting" (backend Setting model: {key, value: JSON string}) has
// its own dedicated public read route rather than one generic
// /public/settings/:key endpoint — map the keys this repository is asked for
// onto the route that serves them.
const PUBLIC_ROUTE_BY_KEY: Record<string, string> = {
  geely_team: "/public/geely-team",
  about_page: "/public/about",
  footer_content: "/public/footer",
};

export const settingRepository = {
  async getSetting(key: string) {
    return settingRepository.findByKey(key);
  },
  async getSettings(keys: string[]) {
    const entries = await Promise.all(
      keys.map(async (key) => [key, await settingRepository.findByKey(key)] as const)
    );
    return Object.fromEntries(entries);
  },
  // Returns a Setting-shaped { value: <JSON string> } so callers can
  // `JSON.parse(result.value)` exactly as they would a row read directly
  // from the `Setting` table, matching the admin/backend convention.
  async findByKey(key: string): Promise<{ key: string; value: string } | null> {
    const route = PUBLIC_ROUTE_BY_KEY[key];
    if (!route) return null;
    try {
      const client = await serverApiClient();
      const { data } = await client.get(route);
      return { key, value: JSON.stringify(data) };
    } catch (error) {
      console.error(`Error fetching setting "${key}":`, error);
      return null;
    }
  },
};
