import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPostTree, newestFirst, sortFolderPosts, validatePosts } from '../../src/lib/post-tree.ts';
import { normalizeTag, matchesTag, uniqueTags } from '../../src/lib/tags.ts';
import { isAncestor, postsUrl } from '../../src/lib/post-urls.ts';

const fixture = (slug: string, folder = 'DE Map/Python', fileName = slug + '.md') => ({
  slug, folder, fileName, pubDate: new Date('2026-09-25'), draft: false, body: 'A real post', filePath: folder + '/' + fileName,
});

test('each post belongs only to its direct folder, at the correct depth', () => {
  const roots = buildPostTree([
    fixture('parent'),
    fixture('child', 'DE Map/Python/파이썬 기본기'),
    fixture('another', 'BE Map/Python'),
  ]);
  assert.deepEqual(roots.map((node) => node.name), ['DE MAP', 'BE MAP', 'PROJECT']);
  const python = roots[0].children[0];
  assert.deepEqual(roots[0].directPostIds, []);
  assert.deepEqual(python.directPostIds, ['parent']);
  assert.deepEqual(python.children[0].directPostIds, ['child']);
  assert.equal(python.depth, 1);
  assert.equal(python.children[0].depth, 2);
  assert.notEqual(python.id, roots[1].children[0].id);
  assert.deepEqual(roots[2].children, []);
});

test('Korean folder names normalize to the same NFC path', () => {
  const tree = buildPostTree([fixture('one', 'DE Map/기록'), fixture('two', 'DE Map/' + '기록'.normalize('NFD'))]);
  assert.equal(tree[0].children.length, 1);
  assert.equal(tree[0].children[0].directPostIds.length, 2);
});

test('numbered lessons use numeric order; normal posts use publication date', () => {
  const lessons = [fixture('ten', undefined, '10_ten.md'), fixture('two', undefined, '02_two.md'), fixture('one', undefined, '01_one.md')];
  assert.deepEqual(sortFolderPosts(lessons).map((post) => post.slug), ['one', 'two', 'ten']);
  const newer = { ...fixture('newer'), pubDate: new Date('2026-09-28') };
  assert.equal([fixture('old'), newer].sort(newestFirst)[0].slug, 'newer');
  assert.deepEqual(sortFolderPosts([fixture('b'), fixture('a')]).map((post) => post.slug), ['a', 'b']);
  assert.throws(() => sortFolderPosts([{ ...fixture('ordered'), order: 1 }, fixture('not-ordered')]), /order must/);
});

test('duplicate URLs and published empty bodies fail validation, including draft collisions', () => {
  assert.throws(() => validatePosts([fixture('same'), { ...fixture('same', 'BE Map'), draft: true }]), /Duplicate slug/);
  assert.throws(() => validatePosts([{ ...fixture('empty'), body: '  ' }]), /no body/);
  assert.doesNotThrow(() => validatePosts([{ ...fixture('empty'), body: '', draft: true }]));
});

test('tags normalize presentation differences but keep C++ and C# distinct', () => {
  assert.equal(normalizeTag(' #ML '), 'ml');
  assert.deepEqual(uniqueTags(['ML', 'ml', '#ML', 'C++', 'C#']).map((tag) => tag.id), ['ml', 'c++', 'c#']);
  assert.equal(matchesTag(['Python', 'Study'], '#PYTHON'), true);
  assert.equal(matchesTag([], ''), true);
});

test('URLs round-trip Korean paths and symbolic tags without path prefix collisions', () => {
  const url = new URL(postsUrl('DE Map/파이썬 기본기', 'c++'), 'https://example.com');
  assert.equal(url.searchParams.get('folder'), 'DE Map/파이썬 기본기');
  assert.equal(url.searchParams.get('tag'), 'c++');
  assert.equal(postsUrl('ignored', '', 'python-study01'), '/posts/python-study01/');
  assert.equal(isAncestor('DE Map/Python', 'DE Map/Python/기본기'), true);
  assert.equal(isAncestor('DE Map/Python', 'DE Map/Python2'), false);
});
