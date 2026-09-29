// Posts 화면에서 방문자의 클릭을 처리하는 파일입니다.
// 배치·색상은 Astro 컴포넌트와 CSS, 폴더 접기·태그 선택·뒤로 가기는 이 파일이 맡습니다.
// 흐름: 주소 읽기 → 현재 상태(state) 결정 → 카드·본문 표시 → 클릭하면 주소와 상태 갱신.
// querySelector는 HTML 요소를 찾는 함수입니다. data-* 속성은 .dataset으로 읽습니다.
// 예: HTML의 data-initial-slug → JavaScript의 dataset.initialSlug.
// HTML 요소 뒤의 !는 TypeScript에 값이 존재한다고 알려주는 표시이며, 값을 만들지는 않습니다.
import { isAncestor, parentFolder, postsUrl } from '../lib/post-urls';
import { normalizeTag } from '../lib/tags';

// PostsLayout.astro의 main을 찾습니다. 없으면 동작을 시작하지 않습니다.
const root = document.querySelector<HTMLElement>('[data-posts-browser]');
if (root) setupBrowser(root);

function setupBrowser(root: HTMLElement) {
  // 자주 조작할 화면 요소를 처음에 찾아 둡니다.
  // 클래스나 data-* 이름을 바꾸면 PostsLayout·CategoryNode·PostCard·TagFilter도 함께 확인하세요.
  const workspace = root.querySelector<HTMLElement>('.posts-workspace')!;
  const sidebar = root.querySelector<HTMLElement>('.posts-sidebar')!;
  const reader = root.querySelector<HTMLElement>('.reader-pane')!;
  const selection = root.querySelector<HTMLElement>('[data-reader-selection]')!;
  const empty = root.querySelector<HTMLElement>('[data-reader-empty]')!;
  const filterEmpty = root.querySelector<HTMLElement>('[data-filter-empty]')!;
  const status = root.querySelector<HTMLElement>('[data-filter-status]')!;
  // querySelectorAll 결과를 [...결과]로 배열로 바꿔 반복합니다.
  // Set은 중복 없는 목록이며, has()로 해당 폴더·태그가 있는지 확인합니다.
  const folders = [...root.querySelectorAll<HTMLDetailsElement>('[data-folder]')];
  const folderIds = new Set(folders.map((folder) => folder.dataset.folder!));
  const cards = [...root.querySelectorAll<HTMLElement>('[data-post-card]')];
  const filters = [...root.querySelectorAll<HTMLAnchorElement>('[data-filter-tag]')];
  const tagIds = new Set(filters.map((filter) => filter.dataset.filterTag!));
  // 처음 내려받은 HTML에 들어 있는 글 정보입니다.
  // JSON.parse는 HTML 속성에 문자열로 저장한 태그 목록을 다시 배열로 읽습니다.
  const initialSlug = root.dataset.initialSlug!;
  const initialFolder = root.dataset.initialFolder!;
  const initialTags: string[] = JSON.parse(root.dataset.initialTags!).map(normalizeTag);
  const initialTitle = root.dataset.initialTitle!;
  // folder: 열린 폴더 경로 / tag: 선택 태그 / slug: 오른쪽에 표시할 글.
  // 빈 문자열은 선택하지 않은 상태입니다.
  let state = { folder: '', tag: '', slug: '' };

  // 주소를 기준으로 화면을 맞춥니다. 새로고침·뒤로 가기에도 같은 상태를 복원합니다.
  function applyLocation() {
    const url = new URL(location.href);
    const selected = initialSlug && url.pathname === postsUrl('', '', initialSlug);
    let tag = normalizeTag(url.searchParams.get('tag') ?? '');
    // 존재하지 않거나 현재 글에 없는 태그라면 전체로 돌립니다.
    // 글 주소로 직접 들어온 사람에게 글이 숨겨져 보이는 상황을 막습니다.
    if (!tagIds.has(tag) || (selected && tag && !initialTags.includes(tag))) tag = '';
    const queryFolder = (url.searchParams.get('folder') ?? '').normalize('NFC');
    const folder = selected ? initialFolder : folderIds.has(queryFolder) ? queryFolder : '';
    state = { folder, tag, slug: selected ? initialSlug : '' };

    // Remove invalid filter state without losing fragment links inside an article.
    // replaceState는 주소만 바로잡고 뒤로 가기 기록을 새로 추가하지 않습니다.
    // #소제목 같은 본문 위치 정보는 url.hash로 유지합니다.
    const clean = postsUrl(folder, tag, state.slug) + url.hash;
    if (url.pathname + url.search + url.hash !== clean) history.replaceState(null, '', clean);

    // 선택 경로와 그 부모만 엽니다. BE MAP을 열면 이전 DE MAP 분기는 닫힙니다.
    for (const node of folders) node.open = isAncestor(node.dataset.folder!, folder);
    // 태그가 맞지 않는 카드는 hidden으로 숨기고, 선택한 카드에는 강조 클래스를 붙입니다.
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
    // 선택한 태그 칩의 모양과 보조 기기에 알려줄 선택 상태를 갱신합니다.
    for (const filter of filters) {
      const active = filter.dataset.filterTag === tag;
      filter.classList.toggle('is-active', active);
      if (active) filter.setAttribute('aria-current', 'true');
      else filter.removeAttribute('aria-current');
      filter.href = postsUrl(folder, filter.dataset.filterTag!);
    }

    // 선택한 글이 있으면 본문, 없으면 안내 문구를 보여줍니다.
    // has-article은 모바일 CSS에서도 읽어 목록과 본문 중 하나를 선택합니다.
    selection.hidden = !state.slug;
    empty.hidden = !!state.slug;
    workspace.classList.toggle('has-article', !!state.slug);
    // 현재 폴더 아래에서 필터에 맞는 글 수를 셉니다. 0개이면 안내를 표시합니다.
    const withinFolder = cards.filter((card) => !folder || isAncestor(folder, card.dataset.folderPath!));
    const count = withinFolder.filter((card) => !card.hidden).length;
    filterEmpty.hidden = !tag || withinFolder.length === 0 || count > 0;
    status.textContent = tag ? count + '개의 글이 태그와 일치합니다.' : '';
    const back = root.querySelector<HTMLAnchorElement>('[data-reader-back]');
    if (back) back.href = postsUrl(folder, tag);
    // 본문 선택 여부에 맞춰 브라우저 탭 제목과 기본 주소(canonical)도 바꿉니다.
    document.title = state.slug ? initialTitle : 'Posts · YUN.LOG';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(location.pathname, canonical.href).href;
    for (const link of sidebar.querySelectorAll<HTMLAnchorElement>('a')) {
      // Keep the source link usable without JavaScript; normal article navigation loads only that article.
      // 목록을 조작하다 링크가 실수로 끌려가는 것을 막습니다.
      link.setAttribute('draggable', 'false');
    }
  }

  // 폴더·태그를 바꾸면 pushState로 뒤로 가기 기록을 추가하고 화면을 갱신합니다.
  // 페이지 전체를 다시 내려받지는 않습니다. 다른 글을 클릭할 때는 일반 링크로 이동합니다.
  function navigate(folder: string, tag: string, slug = '') {
    const next = postsUrl(folder, tag, slug);
    if (location.pathname + location.search !== next) history.pushState(null, '', next);
    applyLocation();
  }

  // main에서 클릭을 받아 어떤 요소를 눌렀는지 구분합니다.
  // closest()는 클릭한 아이콘·글자에서 바깥쪽으로 올라가 해당 버튼이나 링크를 찾습니다.
  root.addEventListener('click', (event) => {
    // Ctrl/Command+클릭이나 가운데 클릭은 브라우저의 새 탭 열기를 그대로 둡니다.
    if (!(event instanceof MouseEvent) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;
    const summary = target.closest('summary');
    // 폴더 클릭: 기본 details 동작을 멈추고 '한 분기만 열기' 규칙을 적용합니다.
    // 열린 폴더를 다시 누르면 부모 경로로 돌아가며, 기존 글 선택은 해제합니다.
    if (summary && sidebar.contains(summary)) {
      const node = summary.parentElement as HTMLDetailsElement;
      event.preventDefault();
      navigate(node.open ? parentFolder(node.dataset.folder!) : node.dataset.folder!, state.tag);
      reader.scrollTop = 0;
      return;
    }
    const filter = target.closest<HTMLAnchorElement>('[data-filter-tag]');
    // 태그 클릭: 현재 글이 해당 태그에도 속하면 계속 보여주고, 아니면 선택을 해제합니다.
    if (filter) {
      event.preventDefault();
      const tag = filter.dataset.filterTag!;
      const keepArticle = state.slug && (!tag || initialTags.includes(tag));
      navigate(state.folder, tag, keepArticle ? state.slug : '');
      return;
    }
    // 모바일 목록 복귀: 읽던 폴더·태그를 유지하고 키보드 초점도 목록으로 옮깁니다.
    if (target.closest('[data-reader-back]')) {
      event.preventDefault();
      navigate(state.folder, state.tag);
      sidebar.focus();
      return;
    }
    // 다른 글을 열기 전에 목록의 스크롤 위치를 같은 탭의 sessionStorage에 저장합니다.
    if (target.closest('[data-article-link]')) {
      try { sessionStorage.setItem('yun-sidebar-scroll', String(sidebar.scrollTop)); } catch {}
    }
  });
  // 브라우저 뒤로/앞으로 가기, 캐시에서 페이지 복원, 첫 진입에 맞춰 화면을 갱신합니다.
  addEventListener('popstate', applyLocation);
  addEventListener('pageshow', (event) => { if (event.persisted) applyLocation(); });
  applyLocation();
  // 브라우저가 목록 배치를 계산할 때 저장해 둔 목록 스크롤 위치를 복원합니다.
  requestAnimationFrame(() => {
    try {
      if (state.folder) sidebar.scrollTop = Number(sessionStorage.getItem('yun-sidebar-scroll') ?? 0);
    } catch {}
  });
}
