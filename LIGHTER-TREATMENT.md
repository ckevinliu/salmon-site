# Lighter Treatment — Homepage Mock

Changes applied to make the site feel lighter and sharper, inspired by meridian.ai and concourse.ai.

## Design Principles

- **Lighter type hierarchy**: display/hero at 300, section subheads at 400, h3/labels at 500, h4 at 600
- **Sharper corners**: pill radius (2rem) replaced with 0.375rem rectangles
- **Subtler interactions**: hover lifts + brightness instead of color swaps
- **Tighter spacing**: reduced section padding and internal gaps to compensate for lighter type
- **Wider label tracking**: uppercase labels use 0.12em letter-spacing

## Global Changes (`css/main.css`)

| Element | Live | Mock |
|---|---|---|
| `--r-pill` | `2rem` | `0.375rem` |
| `--r-sm` | `0.5rem` | `0.375rem` |
| `h1` weight | 700 | 300 |
| `h2` weight | 700 | 300 |
| `h3` weight | 700 | 500 |
| `h4` weight | (none) | 600 |
| `.btn` weight | 600 | 500, +`letter-spacing: 0.02em` |
| `.btn-primary:hover` | white bg swap | salmon + `brightness(1.1)` + `translateY(-2px)` |
| `.btn-lg` | `1rem 2.25rem`, `1rem` font | `0.8rem 1.75rem`, `0.9375rem` font |
| `.nav-link` weight | 500 | 400, +`letter-spacing: 0.02em` |
| `.footer-col a:hover` | salmon | light-grey |
| `.section-lg` | `7rem 0` | `5.5rem 0` |

## Homepage Changes (`index.html` inline styles)

| Element | Live | Mock |
|---|---|---|
| `.features-header-text` | weight 700 | weight 400, +`letter-spacing: -0.01em` |
| `.features-header-body` gap | 4.625rem | 3rem |
| `.feature-text p` | (default) | `font-weight: 300` |
| `.who-section` padding | 12.69rem / 17.31rem | 8rem / 12rem |
| `.who-label` | weight 700, ls 0.02em | weight 500, ls 0.12em |
| `.who-body` gap | 6.25rem | 3.5rem |
| `.who-body-text` | weight 700 | weight 400, +`letter-spacing: -0.01em` |
| `.section-label` | weight 700, ls 0.02em | weight 500, ls 0.12em |
| `.testimonials-section` bg | `var(--dark)` | `#1a1a1a` |
| `.testimonial-quote` | weight 700 | weight 300, italic, `line-height: 1.35`, `color: rgba(255,255,255,0.85)` |
| `.testimonial-attr` | 1rem | 0.875rem, weight 400, ls 0.02em |
| `.testimonial-slide` gap | 4.5rem | 3rem |
| `.connect-grid h2` | weight 700 | weight 500, ls 0.12em |
| `.connect-grid .sub` | weight 700 | weight 400, +`letter-spacing: -0.01em` |
| `.logo-strip-logos span` | weight 700 | weight 500 |

## Hero Widget (`js/salmon-hero.js`)

| Element | Live | Mock |
|---|---|---|
| `.sh-h1` weight | 700 | 300, ls `-0.03em` |
| `.sh-pill` radius | 2rem | 0.375rem |

## Remaining Pages

The global changes in `main.css` (radius, heading weights, button styles, nav, footer, section padding) apply site-wide. Page-specific inline styles on other pages (story, how-we-work, pricing, data, contact, security, solutions, compare) have not been updated yet.
