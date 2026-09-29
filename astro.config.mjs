// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://Yoonjoony.github.io',
	trailingSlash: 'always',
	integrations: [mdx(), sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/blog/') && !new URL(page).pathname.startsWith('/posts/archive-') && !page.endsWith('/404/') })],
	markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: 'dark' } },
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
