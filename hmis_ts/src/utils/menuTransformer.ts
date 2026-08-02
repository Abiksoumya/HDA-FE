





import type { MenuItem } from '@/types';

// "Company Wise Department" → "/company_wise_department"
function labelToPath(label: string): string {
  return '/' + label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_&]/g, '');
}

interface RawMenuNode {
  MenuID: number;
  ParentID: number;
  Description: string;
  GroupFlag: string;
  Icon?: string;
  MenuButtons?: { ButtonName: string }[];
  ChildMenu?: RawMenuNode[];
}

export function transformMenuData(apiResponse: any): MenuItem[] {
  const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
  if (!menuTree.length) return [];

  const buildNode = (node: RawMenuNode): MenuItem => {
    const hasChildren = (node.ChildMenu?.length ?? 0) > 0;
    return {
      id: String(node.MenuID),
      label: node.Description,
      icon: node.Icon ?? null,
      path: hasChildren ? '' : labelToPath(node.Description),
      children: hasChildren ? node.ChildMenu!.map(buildNode) : [],
    };
  };

  return menuTree.map(buildNode);
}

// Returns a map of route path → unique button names for that page
export function buildButtonMap(apiResponse: any): Record<string, string[]> {
  const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
  const map: Record<string, string[]> = {};

  function traverse(node: RawMenuNode) {
    const hasChildren = (node.ChildMenu?.length ?? 0) > 0;
    if (!hasChildren) {
      const path = labelToPath(node.Description);
      const buttons = (node.MenuButtons ?? []).map((b) => b.ButtonName);
      map[path] = [...new Set(buttons)];
    }
    node.ChildMenu?.forEach(traverse);
  }

  menuTree.forEach(traverse);
  return map;
}