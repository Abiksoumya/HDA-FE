

import type { MenuItem } from '@/types';

interface RawMenuNode {
  MenuID: number;
  ParentID: number;
  Description: string;
  GroupFlag: string;
  Icon?: string;
  MenuButtons?: { ButtonName: string }[];
  ChildMenu?: RawMenuNode[];
}

// "Company Wise Department" → "company_wise_department"
function slug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_&]/g, '');
}

// Leaf labels that appear more than once (e.g. "Preparation" / "Passing" under every voucher)
function findDuplicateLeafSlugs(nodes: RawMenuNode[]): Set<string> {
  const counts = new Map<string, number>();
  const walk = (n: RawMenuNode) => {
    if (n.ChildMenu?.length) {
      n.ChildMenu.forEach(walk);
    } else {
      const s = slug(n.Description);
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  };
  nodes.forEach(walk);
  return new Set([...counts].filter(([, c]) => c > 1).map(([s]) => s));
}

// Unique labels keep their existing route ("/company").
// Duplicate labels are prefixed with their parent ("/cash_voucher/preparation").
function leafPath(node: RawMenuNode, parent: RawMenuNode | null, dupes: Set<string>): string {
  const s = slug(node.Description);
  return dupes.has(s) && parent ? `/${slug(parent.Description)}/${s}` : `/${s}`;
}

export function transformMenuData(apiResponse: any): MenuItem[] {
  const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
  if (!menuTree.length) return [];
  const dupes = findDuplicateLeafSlugs(menuTree);

  const buildNode = (node: RawMenuNode, parent: RawMenuNode | null): MenuItem => {
    const hasChildren = (node.ChildMenu?.length ?? 0) > 0;
    return {
      id: String(node.MenuID),
      label: node.Description,
      icon: node.Icon ?? null,
      path: hasChildren ? '' : leafPath(node, parent, dupes),
      children: hasChildren ? node.ChildMenu!.map((c) => buildNode(c, node)) : [],
    };
  };

  return menuTree.map((n) => buildNode(n, null));
}

// Returns a map of route path → unique button names for that page
export function buildButtonMap(apiResponse: any): Record<string, string[]> {
  const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
  const dupes = findDuplicateLeafSlugs(menuTree);
  const map: Record<string, string[]> = {};

  const traverse = (node: RawMenuNode, parent: RawMenuNode | null) => {
    if (node.ChildMenu?.length) {
      node.ChildMenu.forEach((c) => traverse(c, node));
    } else {
      const buttons = (node.MenuButtons ?? []).map((b) => b.ButtonName);
      map[leafPath(node, parent, dupes)] = [...new Set(buttons)];
    }
  };

  menuTree.forEach((n) => traverse(n, null));
  return map;
}



// import type { MenuItem } from '@/types';

// // "Company Wise Department" → "/company_wise_department"
// function labelToPath(label: string): string {
//   return '/' + label
//     .toLowerCase()
//     .trim()
//     .replace(/\s+/g, '_')
//     .replace(/[^a-z0-9_&]/g, '');
// }

// interface RawMenuNode {
//   MenuID: number;
//   ParentID: number;
//   Description: string;
//   GroupFlag: string;
//   Icon?: string;
//   MenuButtons?: { ButtonName: string }[];
//   ChildMenu?: RawMenuNode[];
// }

// export function transformMenuData(apiResponse: any): MenuItem[] {
//   const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
//   if (!menuTree.length) return [];

//   const buildNode = (node: RawMenuNode): MenuItem => {
//     const hasChildren = (node.ChildMenu?.length ?? 0) > 0;
//     return {
//       id: String(node.MenuID),
//       label: node.Description,
//       icon: node.Icon ?? null,
//       path: hasChildren ? '' : labelToPath(node.Description),
//       children: hasChildren ? node.ChildMenu!.map(buildNode) : [],
//     };
//   };

//   return menuTree.map(buildNode);
// }

// // Returns a map of route path → unique button names for that page
// export function buildButtonMap(apiResponse: any): Record<string, string[]> {
//   const menuTree: RawMenuNode[] = apiResponse?.Menu ?? [];
//   const map: Record<string, string[]> = {};

//   function traverse(node: RawMenuNode) {
//     const hasChildren = (node.ChildMenu?.length ?? 0) > 0;
//     if (!hasChildren) {
//       const path = labelToPath(node.Description);
//       const buttons = (node.MenuButtons ?? []).map((b) => b.ButtonName);
//       map[path] = [...new Set(buttons)];
//     }
//     node.ChildMenu?.forEach(traverse);
//   }

//   menuTree.forEach(traverse);
//   return map;
// }