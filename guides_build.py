# -*- coding: utf-8 -*-
"""Generate the /guides/ knowledge hub: small, server-rendered, answer-first pages.

Design intent: these pages exist to be READ AND QUOTED - by buyers, by Google's
AI Overviews, and by assistants that retrieve at the passage level. So: a direct
answer in the first 200 characters after the H1, question-shaped H2s, tables,
named specifics, and outbound citations to MahaRERA and government sources.
"""
import html, json
from pathlib import Path

BASE = 'https://omshantinrconstruction.com'
ORG = BASE + '/#organization'

CSS = """
:root{--gold:#C8A96E;--gold-light:#E2C98A;--gold-dark:#9A7A45;--bg-dark:#0E0C0A;--bg-mid:#1A1612;--bg-card:#1F1B16;--text-primary:#F0E8D8;--text-secondary:#A89880;--text-muted:#6A5E50;--border:rgba(200,169,110,0.15);--border-strong:rgba(200,169,110,0.35)}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Jost",system-ui,sans-serif;background:var(--bg-dark);color:var(--text-primary);font-size:16px;line-height:1.75;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;line-height:1.15}
a{color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(200,169,110,.28)}
a:hover{color:var(--gold-light)}
header.site{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:14px 5vw;background:rgba(14,12,10,.94);backdrop-filter:blur(12px);border-bottom:.5px solid var(--border)}
header.site .brand{font-family:"Cormorant Garamond",serif;font-size:19px;font-weight:700;color:var(--gold);letter-spacing:1.5px;border:0}
header.site .brand span{display:block;font-family:"Jost",sans-serif;font-size:9px;letter-spacing:3px;color:var(--text-muted);text-transform:uppercase;font-weight:400}
header.site .cta{font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid var(--gold-dark);padding:8px 18px;color:var(--gold)}
header.site .cta:hover{background:var(--gold);color:var(--bg-dark)}
.wrap{max-width:760px;margin:0 auto;padding:0 5vw}
nav.crumbs{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text-muted);padding:2.5rem 0 0}
nav.crumbs a{border:0;color:var(--text-secondary)}
.eyebrow{display:flex;align-items:center;gap:12px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin:2.5rem 0 1rem}
.eyebrow::before{content:"";width:34px;height:1px;background:var(--gold)}
h1{font-size:clamp(34px,5.4vw,54px);margin-bottom:1.25rem}
.answer{font-size:18px;line-height:1.7;color:var(--text-primary);border-left:2px solid var(--gold);padding:0 0 0 1.5rem;margin:0 0 .75rem}
.meta{font-size:12px;letter-spacing:1px;color:var(--text-muted);margin:1.5rem 0 3rem;padding-bottom:2rem;border-bottom:.5px solid var(--border)}
h2{font-size:clamp(24px,3.2vw,33px);color:var(--gold);margin:3rem 0 1rem}
p{margin-bottom:1.1rem;color:var(--text-secondary)}
ul,ol{margin:0 0 1.5rem 1.15rem;color:var(--text-secondary)}
li{margin-bottom:.6rem;padding-left:.35rem}
li::marker{color:var(--gold-dark)}
.tablewrap{overflow-x:auto;margin:1.5rem 0 2rem;border:.5px solid var(--border)}
table{border-collapse:collapse;width:100%;min-width:520px;font-size:14.5px}
th,td{text-align:left;padding:12px 16px;border-bottom:.5px solid var(--border);vertical-align:top;color:var(--text-secondary)}
th{background:var(--bg-card);color:var(--gold);font-weight:500;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;white-space:nowrap}
tr:last-child td{border-bottom:0}
td:first-child{color:var(--text-primary)}
.faq{margin-top:3.5rem;padding-top:2.5rem;border-top:.5px solid var(--border)}
.faq h3{font-size:20px;color:var(--text-primary);margin:2rem 0 .5rem}
.sources{margin-top:3rem;padding-top:2rem;border-top:.5px solid var(--border);font-size:13.5px}
.sources h3{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--text-muted);font-family:"Jost",sans-serif;margin-bottom:1rem}
.sources li{color:var(--text-muted);margin-bottom:.45rem}
.cta-band{margin:4rem 0 0;padding:2.5rem;background:var(--bg-mid);border:1px solid var(--border-strong)}
.cta-band h3{font-size:26px;color:var(--text-primary);margin-bottom:.5rem}
.cta-band p{font-size:14.5px;margin-bottom:1.5rem}
.btn{display:inline-block;background:var(--gold);color:var(--bg-dark);padding:12px 30px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:500;border:0}
.btn:hover{background:var(--gold-light);color:var(--bg-dark)}
footer.site{margin-top:4rem;padding:2.5rem 5vw 3.5rem;border-top:.5px solid var(--border);font-size:12.5px;color:var(--text-muted);text-align:center}
footer.site a{color:var(--text-secondary);border:0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin:2.5rem 0 1rem}
.card{border:.5px solid var(--border);padding:1.75rem;background:var(--bg-card);transition:border-color .3s}
.card:hover{border-color:var(--border-strong)}
.card h2{font-size:23px;margin:.4rem 0 .6rem;color:var(--text-primary)}
.card p{font-size:14px;margin:0}
.card a{border:0}
.card .tag{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--gold)}
@media(max-width:600px){.answer{font-size:16.5px;padding-left:1.1rem}.cta-band{padding:1.75rem}}
"""

HEAD = """<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{base}/og-image.jpg">
<meta property="og:site_name" content="Om Shanti N R Construction">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{base}/favicon.ico">
<link rel="apple-touch-icon" href="{base}/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=Jost:wght@300;400;500&display=swap">
<style>{css}</style>
{jsonld}
</head>
<body>
<header class="site">
  <a class="brand" href="{base}/">OM SHANTI N R<span>Construction &middot; Palghar</span></a>
  <a class="cta" href="{base}/#contact">Enquire</a>
</header>
"""

FOOT = """
<footer class="site">
  <p><strong style="color:var(--text-secondary)">Om Shanti N R Construction</strong> &middot; Plot No. 13, Jay Gurudev Bunglow, Vajali Pada, Devisha Road, Palghar West, Maharashtra 401404<br>
  <a href="tel:+918262885023">+91 82628 85023</a> &middot; <a href="mailto:info@omshantinrconstruction.com">info@omshantinrconstruction.com</a></p>
  <p style="margin-top:1rem;font-size:11.5px;line-height:1.7">This guide is general information about buying property in Palghar, not legal or investment advice. Verify every MahaRERA registration on the official portal and take independent legal advice before you buy.</p>
  <p style="margin-top:1rem"><a href="{base}/">Home</a> &middot; <a href="{base}/#projects">Projects</a> &middot; <a href="{base}/guides/">Guides</a> &middot; <a href="{base}/channel-partners/">Channel Partners</a></p>
</footer>
</body>
</html>
"""

def e(s):
    return html.escape(str(s), quote=True)

def _jsonld(blocks):
    return '\n'.join('<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False) + '</script>' for b in blocks)

def _render_body(g, slug):
    url = f'{BASE}/guides/{slug}/'
    out = ['<div class="wrap">']
    out.append(f'<nav class="crumbs"><a href="{BASE}/">Home</a> / <a href="{BASE}/guides/">Guides</a> / {e(g["eyebrow"])}</nav>')
    out.append(f'<div class="eyebrow">{e(g["eyebrow"])}</div>')
    out.append(f'<h1>{e(g["title"])}</h1>')
    out.append(f'<p class="answer">{e(g["answer"])}</p>')
    out.append(f'<p class="meta">Updated {e(g["updated"])} &middot; Written by Om Shanti N R Construction, Palghar</p>')
    for s in g['sections']:
        out.append(f'<h2>{e(s["h2"])}</h2>')
        for para in s.get('p', []):
            out.append(f'<p>{e(para)}</p>')
        if 'table' in s:
            t = s['table']
            out.append('<div class="tablewrap"><table><thead><tr>')
            out += [f'<th>{e(h)}</th>' for h in t['head']]
            out.append('</tr></thead><tbody>')
            for row in t['rows']:
                out.append('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in row) + '</tr>')
            out.append('</tbody></table></div>')
        if 'list' in s:
            out.append('<ul>' + ''.join(f'<li>{e(i)}</li>' for i in s['list']) + '</ul>')
        for para in s.get('p2', []):
            out.append(f'<p>{e(para)}</p>')
    if g.get('faq'):
        out.append('<div class="faq"><h2>Frequently asked questions</h2>')
        for q, a in g['faq']:
            out.append(f'<h3>{e(q)}</h3><p>{e(a)}</p>')
        out.append('</div>')
    if g.get('sources'):
        out.append('<div class="sources"><h3>Sources</h3><ul>')
        for name, href in g['sources']:
            out.append(f'<li><a href="{e(href)}" rel="noopener">{e(name)}</a></li>')
        out.append('</ul></div>')
    out.append(f'''<div class="cta-band">
      <h3>Buying in Palghar?</h3>
      <p>We have built in this town since 1992 and completed thirteen projects here. Ask us anything about a specific locality, a MahaRERA record or a plot - including projects that are not ours.</p>
      <a class="btn" href="{BASE}/#contact">Talk to us</a>
    </div>''')
    out.append('</div>')
    return '\n'.join(out), url

def _page_jsonld(g, slug, url):
    article = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": g['title'], "description": g['meta'],
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "url": url, "inLanguage": "en-IN",
        "datePublished": g['updated'], "dateModified": g['updated'],
        "author": {"@id": ORG}, "publisher": {"@id": ORG},
        "image": BASE + "/og-image.jpg",
        "about": [{"@type": "Place", "name": "Palghar, Maharashtra, India"},
                  {"@type": "Thing", "name": "Real estate"}],
        "isPartOf": {"@type": "CollectionPage", "@id": BASE + "/guides/"},
    }
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Guides", "item": BASE + "/guides/"},
        {"@type": "ListItem", "position": 3, "name": g['title'], "item": url}]}
    blocks = [article, crumbs]
    if g.get('faq'):
        blocks.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in g['faq']]})
    return _jsonld(blocks)

def _hub(guides):
    url = BASE + '/guides/'
    cards = []
    for slug, g in guides.items():
        cards.append(f'''<div class="card"><a href="{BASE}/guides/{slug}/">
          <div class="tag">{e(g["eyebrow"])}</div>
          <h2>{e(g["title"])}</h2>
          <p>{e(g["meta"])}</p></a></div>''')
    body = f'''<div class="wrap">
      <nav class="crumbs"><a href="{BASE}/">Home</a> / Guides</nav>
      <div class="eyebrow">Palghar Property Guides</div>
      <h1>Straight answers about buying in Palghar</h1>
      <p class="answer">Practical, checkable guides to buying a flat or a plot in Palghar, Maharashtra - written by a firm that has built in this town since 1992. No sales copy: MahaRERA verification steps, document checklists, locality comparisons and the questions worth asking any developer, including us.</p>
      <p class="meta">Updated 2026-09-02 &middot; Om Shanti N R Construction, Palghar</p>
      <div class="cards">{''.join(cards)}</div>
      <div class="cta-band"><h3>Have a question we have not answered?</h3>
        <p>Call or WhatsApp and ask. We will tell you what we know about a locality or a project even when it is not ours.</p>
        <a class="btn" href="{BASE}/#contact">Talk to us</a></div>
    </div>'''
    ld = _jsonld([
        {"@context": "https://schema.org", "@type": "CollectionPage", "@id": url, "url": url,
         "name": "Palghar Property Guides", "inLanguage": "en-IN",
         "description": "Practical guides to buying property in Palghar, Maharashtra: MahaRERA verification, document checklists, locality comparisons and plot buying.",
         "publisher": {"@id": ORG},
         "hasPart": [{"@type": "Article", "headline": g['title'], "url": f'{BASE}/guides/{s}/'} for s, g in guides.items()]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Guides", "item": url}]}])
    head = HEAD.format(title="Palghar Property Guides | Om Shanti N R Construction",
                       desc="Practical guides to buying a flat or plot in Palghar, Maharashtra: MahaRERA verification, document checklists, Palghar West vs East, and NA plot due diligence.",
                       url=url, base=BASE, css=CSS, jsonld=ld)
    return head + body + FOOT.format(base=BASE), url

def build_guides(project_dir, dist_dir, guides):
    urls = []
    page, hub_url = _hub(guides)
    for base in (Path(project_dir), Path(dist_dir)):
        p = base / 'guides' / 'index.html'
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(page, encoding='utf-8')
    urls.append(hub_url)
    for slug, g in guides.items():
        body, url = _render_body(g, slug)
        head = HEAD.format(title=g['title'] + ' | Om Shanti N R Construction',
                           desc=g['meta'], url=url, base=BASE, css=CSS,
                           jsonld=_page_jsonld(g, slug, url))
        page = head + body + FOOT.format(base=BASE)
        for base in (Path(project_dir), Path(dist_dir)):
            p = base / 'guides' / slug / 'index.html'
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(page, encoding='utf-8')
        urls.append(url)
    return urls
