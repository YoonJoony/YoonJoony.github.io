export function postsUrl(folder = '', tag = '', slug = '') {
  const query = new URLSearchParams();
  if (folder && !slug) query.set('folder', folder);
  if (tag) query.set('tag', tag);
  return '/posts/' + (slug ? encodeURIComponent(slug) + '/' : '') + (query.size ? '?' + query : '');
}

export const isAncestor = (ancestor: string, path: string) => path === ancestor || path.startsWith(ancestor + '/');
export const parentFolder = (folder: string) => folder.split('/').slice(0, -1).join('/');
