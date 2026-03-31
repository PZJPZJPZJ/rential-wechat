import { prisma } from '@/lib/db';
import { success } from '@/lib/response';

interface CategoryNode {
  id: number;
  groupId: string;
  name: string;
  thumbnail: string | null;
  parentId: number | null;
  sort: number;
  children: CategoryNode[];
}

interface CategoryOutput {
  groupId: string;
  name: string;
  thumbnail: string | null;
  children: CategoryOutput[];
}

const toOutput = (node: CategoryNode): CategoryOutput => ({
  groupId: node.groupId,
  name: node.name,
  thumbnail: node.thumbnail,
  children: node.children.map(toOutput),
});

export async function GET(): Promise<Response> {
  const categories = await prisma.category.findMany({
    orderBy: [{ sort: 'asc' }, { id: 'asc' }],
  });

  const nodes = new Map<number, CategoryNode>();
  for (const item of categories) {
    nodes.set(item.id, {
      id: item.id,
      groupId: item.groupId,
      name: item.name,
      thumbnail: item.thumbnail,
      parentId: item.parentId,
      sort: item.sort,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }

    const parent = nodes.get(node.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }

    parent.children.push(node);
  }

  const sortNodes = (items: CategoryNode[]) => {
    items.sort((a, b) => (a.sort === b.sort ? a.id - b.id : a.sort - b.sort));
    for (const item of items) {
      sortNodes(item.children);
    }
  };
  sortNodes(roots);

  return success(roots.map(toOutput));
}
