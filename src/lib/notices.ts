import { newestFirst } from './post-tree.ts';
import { matchesTag } from './tags.ts';

// 공지는 별도 글 종류가 아니라, 기존 글에 '공지사항' 태그를 붙여 표시합니다.
interface NoticePost {
  title: string;
  slug: string;
  pubDate: Date;
  tags: string[];
  draft: boolean;
}

export type Notice = Pick<NoticePost, 'title' | 'slug'>;

export function getNotices(posts: readonly NoticePost[]): Notice[] {
  return posts
    .filter((post) => !post.draft && matchesTag(post.tags, '공지사항'))
    .sort(newestFirst)
    .slice(0, 3)
    .map(({ title, slug }) => ({ title, slug }));
}
