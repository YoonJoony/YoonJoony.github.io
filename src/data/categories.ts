// Posts의 최상위 카테고리입니다. 배열 순서대로 표시하며, 처음 접속하면 첫 항목만 펼칩니다.
// id는 src/content/blog 안의 실제 폴더 이름, name은 방문자에게 보일 이름입니다.
// 표시 이름만 바꾸려면 name을 수정하세요. id를 바꾸면 글 폴더와 관련 코드도 맞춰야 합니다.
// 새 최상위 폴더를 이 배열에 추가하면 메뉴와 Markdown/MDX 수집 대상에 함께 반영됩니다.
export const categories = [
  { id: 'AI Map', name: 'AI MAP' },
  { id: 'BE Map', name: 'BE MAP' },
  { id: 'Project Map', name: 'PROJECT' },
  { id: 'Blog', name: 'BLOG' },
  { id: 'Claude', name: 'CLAUDE' },
] as const;
