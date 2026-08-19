import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://www.nepsaathi.com';
const API_URL = process.env.VITE_API_URL || 'https://nepsaathi-production.up.railway.app';

const LOCATION_SLUGS = [
  'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'canberra',
  'parramatta', 'hurstville', 'auburn', 'blacktown',
];

const STATIC_PAGES = [
  { path: '/',            changefreq: 'daily',   priority: '1.0' },
  { path: '/featured',    changefreq: 'daily',   priority: '0.9' },
  { path: '/jobs',        changefreq: 'hourly',  priority: '0.9' },
  { path: '/rooms',       changefreq: 'hourly',  priority: '0.9' },
  { path: '/events',      changefreq: 'daily',   priority: '0.8' },
  { path: '/notices',     changefreq: 'daily',   priority: '0.8' },
  { path: '/businesses',  changefreq: 'weekly',  priority: '0.8' },
  { path: '/forum',            changefreq: 'hourly',  priority: '0.9' },
  { path: '/visa-hub',         changefreq: 'weekly',  priority: '0.8' },
  { path: '/send-money',       changefreq: 'daily',   priority: '0.7' },
  { path: '/new-to-australia', changefreq: 'monthly', priority: '0.7' },
  { path: '/services',         changefreq: 'daily',   priority: '0.7' },
  { path: '/looking-for',      changefreq: 'daily',   priority: '0.7' },
  { path: '/search',           changefreq: 'always',  priority: '0.7' },
  { path: '/privacy',          changefreq: 'monthly', priority: '0.4' },
  { path: '/terms',            changefreq: 'monthly', priority: '0.4' },
  { path: '/contact',          changefreq: 'monthly', priority: '0.4' },
  // Location landing pages
  ...LOCATION_SLUGS.map(s => ({ path: `/jobs/in/${s}`,  changefreq: 'daily', priority: '0.8' })),
  ...LOCATION_SLUGS.map(s => ({ path: `/rooms/in/${s}`, changefreq: 'daily', priority: '0.8' })),
];

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod    ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority   ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function generate() {
  let listings = [];
  let businesses = [];
  let forumPosts = [];

  try {
    const res = await fetch(`${API_URL}/api/listings/sitemap/`);
    if (res.ok) {
      const data = await res.json();
      listings = data.listings || [];
      businesses = data.businesses || [];
      console.log(`Sitemap: fetched ${listings.length} listings, ${businesses.length} businesses`);
    } else {
      console.warn(`Sitemap API returned ${res.status} — generating static pages only`);
    }
  } catch (err) {
    console.warn(`Sitemap API unreachable (${err.message}) — generating static pages only`);
  }

  try {
    // Paginate through all forum posts (page_size=200 per page)
    let page = 1;
    while (true) {
      const res = await fetch(`${API_URL}/api/forum/?page_size=200&page=${page}`);
      if (!res.ok) break;
      const data = await res.json();
      const results = data.results ?? data;
      if (!Array.isArray(results) || results.length === 0) break;
      forumPosts.push(...results.map(p => ({ slug: p.slug, updated_at: p.updated_at || p.created_at })));
      if (!data.next) break;
      page++;
    }
    console.log(`Sitemap: fetched ${forumPosts.length} forum posts`);
  } catch (err) {
    console.warn(`Forum sitemap fetch failed (${err.message})`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    ...STATIC_PAGES.map(p => urlEntry({ loc: `${BASE_URL}${p.path}`, lastmod: today, ...p })),
    ...listings.map(l => urlEntry({ loc: `${BASE_URL}${l.path}`, lastmod: l.lastmod, changefreq: 'weekly', priority: '0.6' })),
    ...businesses.map(b => urlEntry({ loc: `${BASE_URL}${b.path}`, lastmod: b.lastmod, changefreq: 'weekly', priority: '0.6' })),
    ...forumPosts.map(p => urlEntry({ loc: `${BASE_URL}/forum/${p.slug}`, lastmod: p.updated_at?.slice(0, 10), changefreq: 'weekly', priority: '0.7' })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '',
    ...entries,
    '',
    '</urlset>',
  ].join('\n');

  const out = resolve(__dirname, 'public/sitemap.xml');
  writeFileSync(out, xml);
  console.log(`Sitemap written: ${entries.length} URLs → ${out}`);
}

generate();
