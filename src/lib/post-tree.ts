import { categories } from '../data/categories.ts';

export interface TreePost {
  slug: string;
  folder: string;
  fileName: string;
  pubDate: Date;
  order?: number;
}

export interface FolderNode {
  id: string;
  name: string;
  depth: number;
  directPostIds: string[];
  children: FolderNode[];
}

export function newestFirst(a: Pick<TreePost, 'pubDate' | 'slug'>, b: Pick<TreePost, 'pubDate' | 'slug'>) {
  return b.pubDate.getTime() - a.pubDate.getTime() || a.slug.localeCompare(b.slug, 'en');
}

export function sortFolderPosts<T extends TreePost>(posts: T[]): T[] {
  if (posts.some((post) => post.order !== undefined)) {
    if (posts.some((post) => post.order === undefined)) throw new Error('order must be set on every post in ' + posts[0].folder);
    return [...posts].sort((a, b) => a.order! - b.order! || newestFirst(a, b));
  }
  const numbered = posts.length > 0 && posts.every((post) => /^\d+[_-]/.test(post.fileName));
  return [...posts].sort(numbered
    ? (a, b) => Number.parseInt(a.fileName) - Number.parseInt(b.fileName) || newestFirst(a, b)
    : newestFirst);
}

export function buildPostTree(posts: TreePost[]): FolderNode[] {
  const roots: FolderNode[] = categories.map((category) => ({ ...category, depth: 0, directPostIds: [], children: [] }));
  const map = new Map(roots.map((node) => [node.id, node]));
  const byFolder = new Map<string, TreePost[]>();
  for (const post of posts) {
    const path = post.folder.normalize('NFC').split('/');
    let parent = map.get(path[0]);
    if (!parent) throw new Error('Unknown category: ' + post.folder);
    for (let depth = 1; depth < path.length; depth++) {
      const id = path.slice(0, depth + 1).join('/');
      let child = map.get(id);
      if (!child) {
        child = { id, name: path[depth], depth, directPostIds: [], children: [] };
        map.set(id, child);
        parent.children.push(child);
      }
      parent = child;
    }
    const group = byFolder.get(parent.id) ?? [];
    group.push(post);
    byFolder.set(parent.id, group);
  }
  for (const node of map.values()) {
    node.directPostIds = sortFolderPosts(byFolder.get(node.id) ?? []).map((post) => post.slug);
    node.children.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
  }
  return roots;
}

export function validatePosts(posts: (TreePost & { draft: boolean; body: string; filePath: string })[]) {
  const slugs = new Map<string, string>();
  for (const post of posts) {
    const previous = slugs.get(post.slug);
    if (previous) throw new Error('Duplicate slug "' + post.slug + '": ' + previous + ', ' + post.filePath);
    slugs.set(post.slug, post.filePath);
    if (!post.draft && !post.body.trim()) throw new Error('Published post has no body: ' + post.filePath);
  }
}
