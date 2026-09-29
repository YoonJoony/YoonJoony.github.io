import cover from '../assets/default-post-cover.png';

export const site = {
  name: 'YUN.LOG',
  description: '백엔드에서 데이터까지, 배우고 만드는 기록. 공부한 개념과 문제를 해결한 과정을 기록합니다.',
  headline: ['백엔드에서 데이터까지,', '배우고 만드는 기록.'],
  introduction: '공부한 개념과 문제를 해결한 과정을 기록합니다.',
  eyebrow: 'BACKEND · DATA ENGINEERING',
  interests: [
    { icon: 'code', label: 'Java · Spring' },
    { icon: 'database', label: '데이터 엔지니어링 학습' },
    { icon: 'note', label: '프로젝트와 문제 해결' },
  ],
  github: 'https://github.com/YoonJoony',
  cover,
} as const;
