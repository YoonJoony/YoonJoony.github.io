import rss from '@astrojs/rss';
import { getPosts } from '../lib/posts';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

export async function GET(context) {
  return rss({
    title: SITE_TITLE, description: SITE_DESCRIPTION, site: context.site,
    items: (await getPosts()).map((post) => ({
      title: post.title, description: post.description, pubDate: post.pubDate,
      link: '/posts/' + post.slug + '/', categories: post.tags,
    })),
    customData: '<language>ko-kr</language>',
  });
}
