#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// ── Config ──
const POSTS_DIR = path.join(__dirname, 'insights/posts');
const TEMPLATES_DIR = path.join(__dirname, 'insights/_templates');
const OUTPUT_DIR = path.join(__dirname, 'insights');
const SITE_URL = 'https://salmonrun.ai';
const SITE_NAME = 'Salmon';
const WORDS_PER_MIN = 230;

// ── Marked config ──
const renderer = new marked.Renderer();

// External links open in new tab
renderer.link = function ({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens);
  const titleAttr = title ? ` title="${title}"` : '';
  if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
  return `<a href="${href}"${titleAttr}>${text}</a>`;
};

// Lazy-load images
renderer.image = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : '';
  if (title) {
    return `<figure><img src="${href}" alt="${text}" loading="lazy"${titleAttr}><figcaption>${title}</figcaption></figure>`;
  }
  return `<img src="${href}" alt="${text}" loading="lazy"${titleAttr}>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

// ── Helpers ──
function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MIN));
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRssDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toUTCString();
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeHtmlAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Read nav/footer from index.html ──
function extractNavFooter() {
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

  // Extract nav (from <nav to </nav>)
  const navMatch = indexHtml.match(/<!-- ═══ NAV ═══ -->\s*([\s\S]*?)<\/nav>/);
  const nav = navMatch ? navMatch[1] + '</nav>' : '';

  // Extract mobile overlay
  const overlayMatch = indexHtml.match(/<!-- Mobile overlay -->\s*([\s\S]*?)<\/div>\s*\n\s*\n/);
  const overlay = overlayMatch ? overlayMatch[1] + '</div>' : '';

  // Extract footer
  const footerMatch = indexHtml.match(/<!-- ═══ FOOTER ═══ -->\s*([\s\S]*?)<\/footer>/);
  const footer = footerMatch ? footerMatch[1] + '</footer>' : '';

  return {
    nav: nav + '\n\n  ' + overlay,
    footer: footer,
  };
}

// ── Read and parse all posts ──
function loadPosts() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);

    // Validate required fields
    if (!data.title) { console.error(`Missing title in ${file}`); process.exit(1); }
    if (!data.slug) { console.error(`Missing slug in ${file}`); process.exit(1); }
    if (!data.date) { console.error(`Missing date in ${file}`); process.exit(1); }

    const bodyHtml = marked.parse(content);
    const bodyPlain = stripHtml(bodyHtml);
    const readTime = readingTime(content);
    const excerpt = data.excerpt || bodyPlain.substring(0, 160) + '...';

    posts.push({
      ...data,
      tags: data.tags || [],
      author: data.author || SITE_NAME,
      hero_image: data.hero_image || null,
      og_image: data.og_image || data.hero_image || '/images/OG-Image.jpg',
      excerpt,
      bodyHtml,
      bodyPlain: bodyPlain.toLowerCase(),
      readTime,
      dateFormatted: formatDate(data.date),
      dateISO: data.date,
    });
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  return posts;
}

// ── Generate individual post pages ──
function buildPostPages(posts, navFooter) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'post.html'), 'utf8');

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const prev = posts[i + 1] || null;
    const next = posts[i - 1] || null;

    const primaryTag = post.tags[0] || 'Blog';

    // OG tag meta tags
    const ogTags = post.tags.map(t => `  <meta property="article:tag" content="${escapeHtmlAttr(t)}">`).join('\n');

    // Tag pills
    const tagPills = post.tags.map(t =>
      `<a href="/insights/#${encodeURIComponent(t)}" class="post-tag-link">${escapeHtmlAttr(t)}</a>`
    ).join('\n          ');

    // Hero image section
    const heroImageSection = post.hero_image
      ? `<div class="post-hero-img"><div class="container"><img src="${post.hero_image}" alt="${escapeHtmlAttr(post.title)}"></div></div>`
      : '';

    // Prev/next links
    const prevPostLink = prev
      ? `<a href="/insights/${prev.slug}.html" class="post-nav-link prev"><div class="post-nav-label">&larr; Previous</div><div class="post-nav-title">${escapeHtmlAttr(prev.title)}</div></a>`
      : '<div></div>';
    const nextPostLink = next
      ? `<a href="/insights/${next.slug}.html" class="post-nav-link next"><div class="post-nav-label">Next &rarr;</div><div class="post-nav-title">${escapeHtmlAttr(next.title)}</div></a>`
      : '<div></div>';

    // JSON-LD
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.dateISO,
      dateModified: post.dateISO,
      author: { '@type': 'Person', name: post.author },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/salmon_logo.svg` },
      },
      description: post.excerpt,
      image: post.og_image ? `${SITE_URL}${post.og_image}` : undefined,
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/insights/${post.slug}` },
    }, null, 2);

    let html = template
      .replace(/\{\{title\}\}/g, escapeHtmlAttr(post.title))
      .replace(/\{\{titleRaw\}\}/g, post.title)
      .replace(/\{\{excerpt\}\}/g, escapeHtmlAttr(post.excerpt))
      .replace(/\{\{author\}\}/g, escapeHtmlAttr(post.author))
      .replace(/\{\{dateISO\}\}/g, post.dateISO)
      .replace(/\{\{dateFormatted\}\}/g, post.dateFormatted)
      .replace(/\{\{readTime\}\}/g, post.readTime)
      .replace(/\{\{primaryTag\}\}/g, escapeHtmlAttr(primaryTag))
      .replace(/\{\{ogImage\}\}/g, post.og_image || '/images/OG-Image.jpg')
      .replace(/\{\{ogTags\}\}/g, ogTags)
      .replace(/\{\{slug\}\}/g, post.slug)
      .replace('{{body}}', post.bodyHtml)
      .replace('{{tagPills}}', tagPills)
      .replace('{{heroImageSection}}', heroImageSection)
      .replace('{{prevPostLink}}', prevPostLink)
      .replace('{{nextPostLink}}', nextPostLink)
      .replace('{{jsonLd}}', jsonLd)
      .replace('{{nav}}', navFooter.nav)
      .replace('{{footer}}', navFooter.footer);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${post.slug}.html`), html);
  }
}

// ── Generate hub page ──
function buildHubPage(posts, allTags, navFooter) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'hub.html'), 'utf8');

  // Tag chips
  const tagChips = allTags.map(t =>
    `<button class="chip" data-tag="${escapeHtmlAttr(t)}">${escapeHtmlAttr(t)}</button>`
  ).join('\n          ');

  // Post cards
  const postCards = posts.map(post => {
    const tagsStr = post.tags.join(',');
    const tagPills = post.tags.map(t =>
      `<span class="blog-tag-pill">${escapeHtmlAttr(t)}</span>`
    ).join('');

    const imgHtml = post.hero_image
      ? `<div class="blog-card-img" style="background-image: url('${post.hero_image}')"></div>`
      : '';

    return `<article class="blog-card" data-tags="${escapeHtmlAttr(tagsStr)}" data-title="${escapeHtmlAttr(post.title.toLowerCase())}" data-excerpt="${escapeHtmlAttr(post.excerpt.toLowerCase())}">
          <a href="/insights/${post.slug}.html" class="blog-card-link">
            ${imgHtml}
            <div class="blog-card-body">
              <div class="blog-card-meta">
                <time datetime="${post.dateISO}">${post.dateFormatted}</time>
                <span class="blog-card-dot"></span>
                <span>${post.readTime} min read</span>
              </div>
              <h3 class="blog-card-title">${escapeHtmlAttr(post.title)}</h3>
              <p class="blog-card-excerpt">${escapeHtmlAttr(post.excerpt)}</p>
              <div class="blog-card-tags">${tagPills}</div>
            </div>
          </a>
        </article>`;
  }).join('\n        ');

  let html = template
    .replace('{{tagChips}}', tagChips)
    .replace('{{postCards}}', postCards)
    .replace(/\{\{postCount\}\}/g, posts.length)
    .replace('{{nav}}', navFooter.nav)
    .replace('{{footer}}', navFooter.footer);

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
}

// ── Generate search index ──
function buildSearchIndex(posts) {
  const index = posts.map(post => ({
    slug: post.slug,
    title: post.title,
    date: post.dateISO,
    tags: post.tags,
    excerpt: post.excerpt,
    body: post.bodyPlain,
    readTime: post.readTime,
    heroImage: post.hero_image,
  }));

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'search-index.json'),
    JSON.stringify(index)
  );
}

// ── Generate RSS feed ──
function buildRssFeed(posts) {
  const items = posts.slice(0, 20).map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/insights/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/insights/${post.slug}</guid>
      <pubDate>${formatRssDate(post.date)}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
      <author>${escapeXml(post.author)}</author>
${post.tags.map(t => `      <category>${escapeXml(t)}</category>`).join('\n')}
    </item>`).join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME} Blog</title>
    <link>${SITE_URL}/insights</link>
    <description>Insights on CRM data quality, revenue operations, and AI-powered enrichment from the Salmon team.</description>
    <language>en-us</language>
    <lastBuildDate>${formatRssDate(posts[0]?.date || new Date().toISOString().split('T')[0])}</lastBuildDate>
    <atom:link href="${SITE_URL}/insights/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'feed.xml'), feed);
}

// ── Main ──
function main() {
  console.log('Building blog...\n');

  const navFooter = extractNavFooter();
  const posts = loadPosts();

  if (posts.length === 0) {
    console.log('No posts found in blog/posts/. Nothing to build.');
    return;
  }

  // Collect all unique tags
  const allTags = [...new Set(posts.flatMap(p => p.tags))].sort();

  buildPostPages(posts, navFooter);
  buildHubPage(posts, allTags, navFooter);
  buildSearchIndex(posts);
  buildRssFeed(posts);

  console.log(`  ${posts.length} post${posts.length !== 1 ? 's' : ''} built`);
  console.log(`  ${allTags.length} tag${allTags.length !== 1 ? 's' : ''}: ${allTags.join(', ')}`);
  console.log('  search-index.json generated');
  console.log('  feed.xml generated');
  console.log('\nDone!');
}

main();
