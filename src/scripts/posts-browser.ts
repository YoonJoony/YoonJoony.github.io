import { isAncestor, parentFolder, postsUrl } from '../lib/post-urls';
import { normalizeTag } from '../lib/tags';

const root = document.querySelector<HTMLElement>('[data-posts-browser]');
if (root) setupBrowser(root);

function setupBrowser(root: HTMLElement) {
  const workspace = root.querySelector<HTMLElement>('.posts-workspace')!;
  const sidebar = root.querySelector<HTMLElement>('.posts-sidebar')!;
  const reader = root.querySelector<HTMLElement>('.reader-pane')!;
  const selection = root.querySelector<HTMLElement>('[data-reader-selection]')!;
  const empty = root.querySelector<HTMLElement>('[data-reader-empty]')!;
  const filterEmpty = root.querySelector<HTMLElement>('[data-filter-empty]')!;
  const status = root.querySelector<HTMLElement>('[data-filter-status]')!;
  const folders = [...root.querySelectorAll<HTMLDetailsElement>('[data-folder]')];
  const folderIds = new Set(folders.map((folder) => folder.dataset.folder!));
  const cards = [...root.querySelectorAll<HTMLElement>('[data-post-card]')];
  const filters = [...root.querySelectorAll<HTMLAnchorElement>('[data-filter-tag]')];
  const tagIds = new Set(filters.map((filter) => filter.dataset.filterTag!));
  const initialSlug = root.dataset.initialSlug!;
  const initialFolder = root.dataset.initialFolder!;
  const initialTags: string[] = JSON.parse(root.dataset.initialTags!).map(normalizeTag);
  const initialTitle = root.dataset.initialTitle!;
  let state = { folder: '', tag: '', slug: '' };

  function applyLocation() {
    const url = new URL(location.href);
    const selected = initialSlug && url.pathname === postsUrl('', '', initialSlug);
    let tag = normalizeTag(url.searchParams.get('tag') ?? '');
    if (!tagIds.has(tag) || (selected && tag && !initialTags.includes(tag))) tag = '';
    const queryFolder = (url.searchParams.get('folder') ?? '').normalize('NFC');
    const folder = selected ? initialFolder : folderIds.has(queryFolder) ? queryFolder : '';
    state = { folder, tag, slug: selected ? initialSlug : '' };

    // Remove invalid filter state without losing fragment links inside an article.
    const clean = postsUrl(folder, tag, state.slug) + url.hash;
    if (url.pathname + url.search + url.hash !== clean) history.replaceState(null, '', clean);

    for (const node of folders) node.open = isAncestor(node.dataset.folder!, folder);
    for (const card of cards) {
      const tags: string[] = JSON.parse(card.dataset.tags!);
      card.hidden = !!tag && !tags.includes(tag);
      const active = card.dataset.postCard === state.slug;
      card.classList.toggle('is-selected', active);
      for (const anchor of card.querySelectorAll<HTMLAnchorElement>('[data-article-link]')) {
        anchor.href = postsUrl('', tag, card.dataset.postCard!);
        if (active) anchor.setAttribute('aria-current', 'page');
        else anchor.removeAttribute('aria-current');
      }
    }
    for (const filter of filters) {
      const active = filter.dataset.filterTag === tag;
      filter.classList.toggle('is-active', active);
      if (active) filter.setAttribute('aria-current', 'true');
      else filter.removeAttribute('aria-current');
      filter.href = postsUrl(folder, filter.dataset.filterTag!);
    }

    selection.hidden = !state.slug;
    empty.hidden = !!state.slug;
    workspace.classList.toggle('has-article', !!state.slug);
    const withinFolder = cards.filter((card) => !folder || isAncestor(folder, card.dataset.folderPath!));
    const count = withinFolder.filter((card) => !card.hidden).length;
    filterEmpty.hidden = !tag || withinFolder.length === 0 || count > 0;
    status.textContent = tag ? count + '개의 글이 태그와 일치합니다.' : '';
    const back = root.querySelector<HTMLAnchorElement>('[data-reader-back]');
    if (back) back.href = postsUrl(folder, tag);
    document.title = state.slug ? initialTitle : 'Posts · YUN.LOG';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(location.pathname, canonical.href).href;
    for (const link of sidebar.querySelectorAll<HTMLAnchorElement>('a')) {
      // Keep the source link usable without JavaScript; normal article navigation loads only that article.
      link.setAttribute('draggable', 'false');
    }
  }

  function navigate(folder: string, tag: string, slug = '') {
    const next = postsUrl(folder, tag, slug);
    if (location.pathname + location.search !== next) history.pushState(null, '', next);
    applyLocation();
  }

  root.addEventListener('click', (event) => {
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;
    const summary = target.closest('summary');
    if (summary && sidebar.contains(summary)) {
      const node = summary.parentElement as HTMLDetailsElement;
      event.preventDefault();
      navigate(node.open ? parentFolder(node.dataset.folder!) : node.dataset.folder!, state.tag);
      reader.scrollTop = 0;
      return;
    }
    const filter = target.closest<HTMLAnchorElement>('[data-filter-tag]');
    if (filter) {
      event.preventDefault();
      const tag = filter.dataset.filterTag!;
      const keepArticle = state.slug && (!tag || initialTags.includes(tag));
      navigate(state.folder, tag, keepArticle ? state.slug : '');
      return;
    }
    if (target.closest('[data-reader-back]')) {
      event.preventDefault();
      navigate(state.folder, state.tag);
      sidebar.focus();
      return;
    }
    if (target.closest('[data-article-link]')) {
      try { sessionStorage.setItem('yun-sidebar-scroll', String(sidebar.scrollTop)); } catch {}
    }
  });
  addEventListener('popstate', applyLocation);
  addEventListener('pageshow', (event) => { if (event.persisted) applyLocation(); });
  applyLocation();
  requestAnimationFrame(() => {
    try {
      if (state.folder) sidebar.scrollTop = Number(sessionStorage.getItem('yun-sidebar-scroll') ?? 0);
    } catch {}
  });
}
