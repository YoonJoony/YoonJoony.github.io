// 화면에 쓰이는 소개 내용을 모아 둔 설정입니다. 문구 수정은 이 파일부터 시작하세요.
// cover는 소개 사진과, 대표 사진을 지정하지 않은 글·뉴스의 기본 사진으로 함께 사용합니다.
import cover from '../assets/default-post-cover-2.png';
import me from '../assets/me.jpg';

export const site = {
  // 헤더 로고와 푸터에 표시할 이름입니다.
  name: 'YUN.LOG',
  // 검색 결과와 링크 공유에 사용하는 사이트의 기본 설명입니다.
  description: '백엔드에서 데이터까지, 배우고 만드는 기록. 공부한 개념과 문제를 해결한 과정을 기록합니다.',
  // 소개 제목 두 줄 / 그 아래 설명 / 제목 위의 작은 영문 문구 순서입니다.
  headline: ['백엔드에서 데이터까지,', '배우고 만드는 기록.'],
  introduction: '공부한 개념과 문제를 해결한 과정을 기록합니다.',
  eyebrow: 'BACKEND · DATA ENGINEERING',
  // 객체를 추가하면 소개 항목 한 줄이 추가됩니다.
  // icon은 components/Icon.astro의 paths에 정의된 이름을 사용합니다.
  interests: [
    { icon: 'code', label: 'Java · Spring' },
    { icon: 'database', label: '데이터 엔지니어링 학습' },
    { icon: 'note', label: '프로젝트와 문제 해결' },
  ],
  // 푸터와 About에서 사용하는 GitHub 주소입니다.
  github: 'https://github.com/YoonJoony',
  me,
  cover,
} as const;
