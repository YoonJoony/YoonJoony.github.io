import { defineConfig } from 'astro/config';
import config from '../../astro.config.mjs';

// 테스트 전용 설정입니다. 일반 build/배포에는 예시 공지와 테스트 주소가 포함되지 않습니다.
export default defineConfig({
  ...config,
  outDir: './dist-e2e',
  integrations: [...config.integrations, {
    name: 'notice-test-pages',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => injectRoute({
        pattern: '/__tests/notices/[scenario]',
        entrypoint: './tests/fixtures/notices.astro',
      }),
    },
  }],
});
