import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getNotices } from '../../src/lib/notices.ts';

const post = (slug: string, date = '2026-10-01', tags = ['공지사항'], draft = false) => ({
  slug, title: slug + ' 제목', pubDate: new Date(date), tags, draft,
});

test('notices select only public posts with the normalized exact tag', () => {
  const posts = [
    post('plain'), post('hash', undefined, [' #공지사항 ']),
    post('nfd', undefined, ['공지사항'.normalize('NFD')]),
    post('draft', undefined, ['공지사항'], true),
    post('alias', undefined, ['공지']), post('normal', undefined, ['Python']),
  ];
  assert.deepEqual(getNotices(posts).map((item) => item.slug), ['hash', 'nfd', 'plain']);
  assert.deepEqual(getNotices([]), []);
  assert.deepEqual(getNotices([post('draft', undefined, ['공지사항'], true)]), []);
  assert.equal(getNotices([post('duplicate-tag', undefined, ['공지사항', '#공지사항'])]).length, 1);
});

test('notices take the newest three, tie by slug, without mutating the input', () => {
  const posts = [post('older', '2026-09-01'), post('b'), post('a'), post('new', '2026-10-04')];
  const before = [...posts];
  assert.deepEqual(getNotices(posts), [
    { slug: 'new', title: 'new 제목' }, { slug: 'a', title: 'a 제목' }, { slug: 'b', title: 'b 제목' },
  ]);
  assert.deepEqual(posts, before);
});

test('an older notice survives even when the latest three posts are normal posts', () => {
  const posts = [1, 2, 3].map((i) => post(`recent-${i}`, '2026-10-04', ['Study']));
  posts.push(post('older-notice', '2026-09-01'));
  assert.deepEqual(getNotices(posts), [{ slug: 'older-notice', title: 'older-notice 제목' }]);
});
