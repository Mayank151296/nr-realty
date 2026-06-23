#!/usr/bin/env python3
"""
Build script for production - minifies CSS and JS, optimizes images
"""
import os
import shutil
import subprocess
from pathlib import Path
import json

class BuildOptimizer:
    def __init__(self, project_dir):
        self.project_dir = Path(project_dir)
        self.dist_dir = self.project_dir / 'dist'
        self.html_file = self.project_dir / 'index.html'
        self.css_file = self.project_dir / 'styles.css'
        self.js_file = self.project_dir / 'script.js'
        self.images_dir = self.project_dir / 'images'
    
    def setup(self):
        """Create dist directory"""
        self.dist_dir.mkdir(exist_ok=True)
        print("✓ Build directory created")
    
    def minify_css(self):
        """Minify CSS using basic technique"""
        if not self.css_file.exists():
            return
        
        with open(self.css_file, 'r', encoding='utf-8') as f:
            css_content = f.read()
        
        # Basic minification
        minified = css_content
        minified = ' '.join(minified.split())  # Remove extra whitespace
        minified = minified.replace(': ', ':').replace('; ', ';').replace(', ', ',')
        minified = minified.replace(' { ', '{').replace(' } ', '}')
        
        dist_css = self.dist_dir / 'styles.min.css'
        with open(dist_css, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        original_size = len(css_content)
        minified_size = len(minified)
        reduction = ((original_size - minified_size) / original_size) * 100
        
        print(f"✓ CSS minified: {original_size:,} → {minified_size:,} bytes ({reduction:.1f}% reduction)")
    
    def minify_js(self):
        """Minify JavaScript using basic technique"""
        if not self.js_file.exists():
            return
        
        with open(self.js_file, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        # Basic minification
        minified = js_content
        
        # Remove comments
        import re
        minified = re.sub(r'//.*?$', '', minified, flags=re.MULTILINE)  # Single-line comments
        minified = re.sub(r'/\*.*?\*/', '', minified, flags=re.DOTALL)  # Multi-line comments
        
        # Remove extra whitespace while preserving functionality
        lines = minified.split('\n')
        minified = ' '.join([line.strip() for line in lines if line.strip()])
        
        dist_js = self.dist_dir / 'script.min.js'
        with open(dist_js, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        original_size = len(js_content)
        minified_size = len(minified)
        reduction = ((original_size - minified_size) / original_size) * 100
        
        print(f"✓ JavaScript minified: {original_size:,} → {minified_size:,} bytes ({reduction:.1f}% reduction)")
    
    def copy_html(self):
        """Copy HTML and update asset references"""
        with open(self.html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Update references to minified files
        html_content = html_content.replace(
            'href="styles.css"',
            'href="styles.min.css"'
        )
        html_content = html_content.replace(
            'src="script.js"',
            'src="script.min.js"'
        )
        
        # Add cache busting version — forces browsers and CDNs (Cloudflare Pages)
        # to refetch CSS, JS, AND images on every new deploy. Without this,
        # if an image filename stays the same but contents change, edge
        # caches and browser caches will continue serving the old version
        # for hours/days.
        import time, re
        version = int(time.time())
        html_content = html_content.replace(
            'href="styles.min.css"',
            f'href="styles.min.css?v={version}"'
        )
        html_content = html_content.replace(
            'src="script.min.js"',
            f'src="script.min.js?v={version}"'
        )
        # Cache-bust every image and QR reference
        asset_re = re.compile(r'src="((?:images|qr)/[^"?#]+\.(?:jpe?g|png|gif|webp|svg))"', re.IGNORECASE)
        html_content, n_assets = asset_re.subn(rf'src="\g<1>?v={version}"', html_content)

        dist_html = self.dist_dir / 'index.html'
        with open(dist_html, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print(f"✓ HTML copied and updated (v{version}, {n_assets} image/asset URLs cache-busted)")
    
    def copy_images(self):
        """Copy images to dist (overwriting individual files, not the dir)"""
        dist_images = self.dist_dir / 'images'
        dist_images.mkdir(exist_ok=True)
        # Recurse — preserves subfolder structure (e.g. images/aastha/) so per-project asset folders work.
        copied = 0
        for src in self.images_dir.rglob('*'):
            if not src.is_file() or src.name.endswith('.bak') or src.name == '.DS_Store':
                continue
            # Ship WebP only: skip a JPEG/JPG if a .webp sibling exists
            if src.suffix.lower() in ('.jpeg', '.jpg') and src.with_suffix('.webp').exists():
                continue
            rel = src.relative_to(self.images_dir)
            dst = dist_images / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied += 1
        total_size = sum(f.stat().st_size for f in dist_images.rglob('*') if f.is_file())
        print(f"✓ {copied} images copied ({total_size / (1024*1024):.1f} MB)")
    
    def copy_qr(self):
        """Copy QR code images (referenced by project detail pages)"""
        qr_src = self.project_dir / 'qr'
        if not qr_src.exists():
            return
        qr_dst = self.dist_dir / 'qr'
        qr_dst.mkdir(exist_ok=True)
        for src in qr_src.iterdir():
            if src.is_file():
                shutil.copy2(src, qr_dst / src.name)
        qr_count = len([f for f in qr_dst.iterdir() if f.is_file()])
        print(f"✓ {qr_count} QR codes copied")

    def copy_brochures(self):
        """Copy project brochure PDFs (referenced by 'Download Full Brochure' buttons)"""
        br_src = self.project_dir / 'brochures'
        if not br_src.exists():
            return
        br_dst = self.dist_dir / 'brochures'
        br_dst.mkdir(exist_ok=True)
        total = 0
        for src in br_src.iterdir():
            if src.is_file() and not src.name.startswith('.'):
                shutil.copy2(src, br_dst / src.name)
                total += src.stat().st_size
        count = len([f for f in br_dst.iterdir() if f.is_file()])
        print(f"✓ {count} brochures copied ({total / (1024*1024):.1f} MB)")

    def copy_favicons(self):
        """Copy favicon, PWA-icon, Safari mask-icon, and manifest files into dist root"""
        names = ['favicon.ico', 'favicon.png', 'favicon-16.png', 'favicon-32.png',
                 'favicon-48.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
                 'mask-icon.svg', 'manifest.json', 'logo-square.png', 'og-image.jpg']
        copied = 0
        for n in names:
            src = self.project_dir / n
            if src.exists():
                shutil.copy2(src, self.dist_dir / n)
                copied += 1
        print(f"✓ {copied} favicon/icon/manifest files copied")

    def copy_config(self):
        """Copy configuration files"""
        htaccess = self.project_dir / '.htaccess'
        if htaccess.exists():
            shutil.copy(htaccess, self.dist_dir / '.htaccess')
            print("✓ .htaccess copied")

    BASE_URL = 'https://omshantinrconstruction.com'
    PROJECT_PAGES = {
        'ostwal': {'slug': 'projects/ostwal-imperial',
                   'title': 'Ostwal Imperial — Residential & Commercial in Palghar West | Om Shanti N R Realty',
                   'desc': 'Ostwal Imperial by Om Shanti N R Realty — MahaRERA-registered residential & commercial project in Palghar West, Maharashtra. Configurations, RERA details and brochure.'},
        'balaji': {'slug': 'projects/shree-balaji-pride',
                   'title': 'Shree Balaji Pride — Homes in Palghar West | Om Shanti N R Realty',
                   'desc': 'Shree Balaji Pride by Om Shanti N R Realty — MahaRERA-registered residential project in Palghar West, Maharashtra. Configurations, RERA details and brochure.'},
        'shiv': {'slug': 'projects/shiv-shrushti',
                 'title': 'Shiv Shrushti — Residential Project in Palghar West | Om Shanti N R Realty',
                 'desc': 'Shiv Shrushti by Om Shanti N R Realty — MahaRERA-registered residential project in Palghar West, Maharashtra. Configurations, RERA details and brochure.'},
        'aastha': {'slug': 'projects/aastha',
                   'title': 'Aastha — Plotted Development in Palghar | Om Shanti N R Realty',
                   'desc': 'Aastha by Om Shanti N R Realty — plotted development in Palghar, Maharashtra. Layout, approvals and project details.'},
        'leadership': {'slug': 'leadership',
                       'title': 'Leadership — Om Shanti N R Realty | Palghar Real Estate',
                       'desc': 'Meet the leadership of Om Shanti N R Construction (Om Shanti N R Realty) — a Palghar family real estate firm building with trust and compliance since 2005.'},
        'partners': {'slug': 'channel-partners',
                     'title': 'Channel Partners — Om Shanti N R Realty | Palghar Real Estate',
                     'desc': 'Channel partner program of Om Shanti N R Realty (Om Shanti N R Construction) — collaborate on residential and commercial real estate projects in Palghar, Maharashtra.'},
    }

    def generate_project_pages(self):
        """Emit standalone, crawlable HTML at real URLs for each project / leadership,
        so each can be indexed individually. The SPA still drives in-site navigation."""
        import re, time
        src = self.html_file.read_text(encoding='utf-8')
        version = int(time.time())
        count = 0
        for page, meta in self.PROJECT_PAGES.items():
            h = src
            # 1) make asset URLs root-relative so they resolve from a sub-path
            h = re.sub(r'((?:src|href)=")(images/|qr/|brochures/)', r'\1/\2', h)
            h = re.sub(r'((?:src|href)=")(favicon|apple-touch-icon|icon-1|icon-5|mask-icon|manifest\.json|logo-square|og-image)', r'\1/\2', h)
            # 2) cache-bust root-relative assets
            h = re.sub(r'(?:src|href)="/(?:images|qr|brochures)/[^"?#]+\.(?:jpe?g|png|gif|webp|svg|pdf)"',
                       lambda m: m.group(0)[:-1] + f'?v={version}"', h)
            url = f'{self.BASE_URL}/{meta["slug"]}/'
            # 3) per-page SEO head
            h = re.sub(r'<title>.*?</title>', '<title>' + meta['title'] + '</title>', h, count=1, flags=re.S)
            h = re.sub(r'(<meta name="description" content=")[^"]*(")', r'\g<1>' + meta['desc'] + r'\2', h, count=1)
            h = re.sub(r'(<link rel="canonical" href=")[^"]*(")', r'\g<1>' + url + r'\2', h, count=1)
            h = re.sub(r'(<meta property="og:title" content=")[^"]*(")', r'\g<1>' + meta['title'] + r'\2', h, count=1)
            h = re.sub(r'(<meta property="og:description" content=")[^"]*(")', r'\g<1>' + meta['desc'] + r'\2', h, count=1)
            h = re.sub(r'(<meta property="og:url" content=")[^"]*(")', r'\g<1>' + url + r'\2', h, count=1)
            # 4) tell the SPA which page to open on first paint
            h = h.replace('</head>', f'<script>window.__INITIAL_PAGE__="{page}";</script>\n</head>', 1)
            out = self.dist_dir / meta['slug'] / 'index.html'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(h, encoding='utf-8')
            count += 1
        print(f"✓ {count} standalone project/leadership pages generated")

    def copy_seo(self):
        """Generate robots.txt + sitemap.xml listing the real, indexable URLs."""
        urls = [self.BASE_URL + '/'] + [f'{self.BASE_URL}/{m["slug"]}/' for m in self.PROJECT_PAGES.values()]
        today = __import__('datetime').date.today().isoformat()
        sm = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for u in urls:
            pr = '1.0' if u.endswith('.com/') else '0.8'
            sm.append(f'  <url><loc>{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>')
        sm.append('</urlset>')
        (self.dist_dir / 'sitemap.xml').write_text('\n'.join(sm) + '\n', encoding='utf-8')
        robots = ("User-agent: *\nAllow: /\n\n"
                  f"Sitemap: {self.BASE_URL}/sitemap.xml\n")
        (self.dist_dir / 'robots.txt').write_text(robots, encoding='utf-8')
        print(f"✓ sitemap.xml ({len(urls)} URLs) + robots.txt generated")
    
    def generate_report(self):
        """Generate build report"""
        report = {
            'timestamp': __import__('datetime').datetime.now().isoformat(),
            'files': {
                'html': os.path.getsize(self.dist_dir / 'index.html'),
                'css': os.path.getsize(self.dist_dir / 'styles.min.css'),
                'js': os.path.getsize(self.dist_dir / 'script.min.js'),
            },
            'images': len(list((self.dist_dir / 'images').glob('*')))
        }
        
        total_size = sum(report['files'].values())
        image_size = sum(f.stat().st_size for f in (self.dist_dir / 'images').rglob('*') if f.is_file())
        
        print(f"\n{'='*50}")
        print("BUILD REPORT")
        print(f"{'='*50}")
        print(f"HTML:       {report['files']['html']:>10,} bytes")
        print(f"CSS:        {report['files']['css']:>10,} bytes")
        print(f"JavaScript: {report['files']['js']:>10,} bytes")
        print(f"Images:     {image_size:>10,} bytes ({report['images']} files)")
        print(f"{'='*50}")
        print(f"Total Size: {(total_size + image_size) / (1024*1024):>10.2f} MB")
        print(f"{'='*50}\n")
        
        # Save report
        report_file = self.dist_dir / 'build-report.json'
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
    
    def build(self):
        """Run complete build"""
        print("\n" + "="*50)
        print("🔨 Building optimized production version...")
        print("="*50 + "\n")
        
        self.setup()
        self.minify_css()
        self.minify_js()
        self.copy_html()
        self.copy_images()
        self.copy_qr()
        self.copy_brochures()
        self.copy_favicons()
        self.copy_config()
        self.generate_project_pages()
        self.copy_seo()
        self.generate_report()
        
        print("✅ Build completed successfully!")
        print(f"📦 Ready to deploy from: {self.dist_dir}\n")

if __name__ == '__main__':
    # Use the directory containing this script — portable across environments
    builder = BuildOptimizer(Path(__file__).resolve().parent)
    builder.build()
