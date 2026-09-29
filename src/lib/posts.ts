import { getCollection, type CollectionEntry } from 'astro:content';
import { categories } from '../data/categories';
import { site } from '../data/site';
import { newestFirst, validatePosts } from './post-tree';
import { uniqueTags } from './tags';

export async function getPosts() {
  const entries = await getCollection('blog');
  const posts = entries.map((entry) => {
    const path = entry.filePath!.replaceAll('\\', '/').normalize('NFC');
    const relative = path.split('/content/blog/')[1];
    if (!relative) throw new Error('Unrecognized post path: ' + path);
    const segments = relative.split('/');
    const fileName = segments.pop()!;
    const folder = segments.join('/');
    const category = categories.find((item) => item.id === segments[0]);
    return {
      ...entry.data, entry, filePath: path, fileName, folder,
      categoryLabel: [category?.name ?? segments[0], ...segments.slice(1)].join(' / '),
      image: entry.data.heroImage ?? site.cover,
      tagItems: uniqueTags(entry.data.tags),
      body: entry.body ?? '',
    };
  });
  validatePosts(posts);
  return posts.filter((post) => !post.draft).sort(newestFirst);
}

export type Post = Awaited<ReturnType<typeof getPosts>>[number];

export async function getNews() {
  return (await getCollection('news'))
    .filter((item) => !item.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id))
    .slice(0, 3);
}

export const legacySlug = (post: CollectionEntry<'legacy'>) => 'archive-' + post.id;
