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
        
        # Add cache busting version
        import time
        version = int(time.time())
        html_content = html_content.replace(
            'href="styles.min.css"',
            f'href="styles.min.css?v={version}"'
        )
        html_content = html_content.replace(
            'src="script.min.js"',
            f'src="script.min.js?v={version}"'
        )
        
        dist_html = self.dist_dir / 'index.html'
        with open(dist_html, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"✓ HTML copied and updated (v{version})")
    
    def copy_images(self):
        """Copy images to dist (overwriting individual files, not the dir)"""
        dist_images = self.dist_dir / 'images'
        dist_images.mkdir(exist_ok=True)
        # Recurse — preserves subfolder structure (e.g. images/aastha/) so per-project asset folders work.
        copied = 0
        for src in self.images_dir.rglob('*'):
            if not src.is_file() or src.name.endswith('.bak') or src.name == '.DS_Store':
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

    def copy_config(self):
        """Copy configuration files"""
        htaccess = self.project_dir / '.htaccess'
        if htaccess.exists():
            shutil.copy(htaccess, self.dist_dir / '.htaccess')
            print("✓ .htaccess copied")
    
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
        self.copy_config()
        self.generate_report()
        
        print("✅ Build completed successfully!")
        print(f"📦 Ready to deploy from: {self.dist_dir}\n")

if __name__ == '__main__':
    # Use the directory containing this script — portable across environments
    builder = BuildOptimizer(Path(__file__).resolve().parent)
    builder.build()
