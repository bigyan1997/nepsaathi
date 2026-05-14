import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://www.nepsaathi.com';
const API_URL = process.env.VITE_API_URL || 'https://nepsaathi-production.up.railway.app';

const STATIC_PAGES = [
  { path: '/',            changefreq: 'daily',   priority: '1.0' },
  { path: '/featured',    changefreq: 'daily',   priority: '0.9' },
  { path: '/jobs',        changefreq: 'hourly',  priority: '0.9' },
  { path: '/rooms',       changefreq: 'hourly',  priority: '0.9' },
  { path: '/events',      changefreq: 'daily',   priority: '0.8' },
  { path: '/notices',     changefreq: 'daily',   priority: '0.8' },
  { path: '/businesses',  changefreq: 'weekly',  priority: '0.8' },
  { path: '/search',      changefreq: 'always',  priority: '0.7' },
  { path: '/privacy',     changefreq: 'monthly', priority: '0.4' },
  { path: '/terms',       changefreq: 'monthly', priority: '0.4' },
  { path: '/contact',     changefreq: 'monthly', priority: '0.4' },
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

  const entries = [
    ...STATIC_PAGES.map(p => urlEntry({ loc: `${BASE_URL}${p.path}`, ...p })),
    ...listings.map(l => urlEntry({ loc: `${BASE_URL}${l.path}`, lastmod: l.lastmod, changefreq: 'weekly', priority: '0.6' })),
    ...businesses.map(b => urlEntry({ loc: `${BASE_URL}${b.path}`, lastmod: b.lastmod, changefreq: 'weekly', priority: '0.6' })),
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
