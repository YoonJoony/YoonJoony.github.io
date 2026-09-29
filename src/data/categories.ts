// Posts에서 항상 보여줄 세 최상위 카테고리입니다. 배열 순서가 화면 표시 순서입니다.
// id는 src/content/blog 안의 실제 폴더 이름, name은 방문자에게 보일 이름입니다.
// 표시 이름만 바꾸려면 name을 수정하세요. id를 바꾸면 글 폴더와 관련 코드도 맞춰야 합니다.
export const categories = [
  { id: 'DE Map', name: 'DE MAP' },
  { id: 'BE Map', name: 'BE MAP' },
  { id: 'Project Map', name: 'PROJECT' },
] as const;
