import type { MenuItem, RawMenuItem } from '@/types';

// "Company Wise Department" → "/company-wise-department"
function labelToPath(label: string): string {
  return '/' + label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // spaces → hyphens
    .replace(/[^a-z0-9-]/g, ''); // remove special chars
}

interface MenuApiResponse {
  data: RawMenuItem[];
}

export function transformMenuData(apiResponse: MenuApiResponse): MenuItem[] {
  const map: Record<number, MenuItem> = {};
  const roots: MenuItem[] = [];

  apiResponse.data.forEach((item) => {
    map[item.menu_code] = {
      id: String(item.menu_key_code),
      label: item.menu_name,
      icon: item.menu_icon ?? null,
      path: item.menu_url
        ? `/${item.menu_url}`
        : labelToPath(item.menu_name), // ← use label if no url
      children: [],
    };
  });

  apiResponse.data.forEach((item) => {
    const node = map[item.menu_code];
    if (item.menu_group_code === 0) {
      roots.push(node);
    } else {
      const parent = map[item.menu_group_code];
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      }
    }
  });

  return roots;
}