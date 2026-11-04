#!/usr/bin/env python3
"""
Convert Admin User Guide markdown to PDF
"""

import os
from pathlib import Path

# First, try using markdown2pdf or pypandoc if available
try:
    import markdown
    from xhtml2pdf import pisa
    
    def markdown_to_pdf(md_file, pdf_file):
        """Convert markdown to PDF using xhtml2pdf"""
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convert markdown to HTML
        html_content = markdown.markdown(md_content, extensions=['extra', 'codehilite', 'toc'])
        
        # Wrap in HTML template with styling
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ font-family: Arial, sans-serif; }}
                body {{ margin: 2cm; line-height: 1.6; color: #333; }}
                h1 {{ color: #1e40af; font-size: 28px; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }}
                h2 {{ color: #1e3a8a; font-size: 22px; margin-top: 30px; border-left: 4px solid #1e40af; padding-left: 10px; }}
                h3 {{ color: #1e3a8a; font-size: 16px; }}
                h4 {{ color: #2d5a8c; font-size: 14px; }}
                p {{ margin: 10px 0; }}
                ul, ol {{ margin: 10px 0 10px 20px; }}
                li {{ margin: 8px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #1e40af; color: white; }}
                tr:nth-child(even) {{ background-color: #f3f4f6; }}
                code {{ background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; }}
                pre {{ background-color: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 5px; overflow-x: auto; }}
                .section {{ page-break-inside: avoid; margin-bottom: 20px; }}
                em {{ color: #dc2626; }}
                strong {{ color: #000; font-weight: bold; }}
                a {{ color: #1e40af; text-decoration: none; }}
                .toc {{ background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="section">
                <h1>Aishwaryam Inn - Admin Panel User Guide</h1>
                <p><strong>Version:</strong> 1.0 (November 2025)</p>
                <p><strong>Last Updated:</strong> November 20, 2025</p>
            </div>
            {html_content}
            <div class="footer">
                <p>© 2025 Aishwaryam Inn. All rights reserved.</p>
                <p>For support: aishwaryaminn@gmail.com | +91 9443224498</p>
            </div>
        </body>
        </html>
        """
        
        # Convert HTML to PDF
        with open(pdf_file, 'wb') as pdf:
            pisa.CreatePDF(full_html, pdf)
        
        return True

except ImportError:
    print("Required libraries not found. Installing dependencies...")
    os.system("pip install markdown xhtml2pdf")
    
    import markdown
    from xhtml2pdf import pisa
    
    def markdown_to_pdf(md_file, pdf_file):
        """Convert markdown to PDF using xhtml2pdf"""
        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()
        
        # Convert markdown to HTML
        html_content = markdown.markdown(md_content, extensions=['extra', 'codehilite', 'toc'])
        
        # Wrap in HTML template with styling
        full_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ font-family: Arial, sans-serif; }}
                body {{ margin: 2cm; line-height: 1.6; color: #333; }}
                h1 {{ color: #1e40af; font-size: 28px; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }}
                h2 {{ color: #1e3a8a; font-size: 22px; margin-top: 30px; border-left: 4px solid #1e40af; padding-left: 10px; }}
                h3 {{ color: #1e3a8a; font-size: 16px; }}
                h4 {{ color: #2d5a8c; font-size: 14px; }}
                p {{ margin: 10px 0; }}
                ul, ol {{ margin: 10px 0 10px 20px; }}
                li {{ margin: 8px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #1e40af; color: white; }}
                tr:nth-child(even) {{ background-color: #f3f4f6; }}
                code {{ background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; }}
                pre {{ background-color: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 5px; overflow-x: auto; }}
                .section {{ page-break-inside: avoid; margin-bottom: 20px; }}
                em {{ color: #dc2626; }}
                strong {{ color: #000; font-weight: bold; }}
                a {{ color: #1e40af; text-decoration: none; }}
                .toc {{ background-color: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0; }}
                .footer {{ margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="section">
                <h1>Aishwaryam Inn - Admin Panel User Guide</h1>
                <p><strong>Version:</strong> 1.0 (November 2025)</p>
                <p><strong>Last Updated:</strong> November 20, 2025</p>
            </div>
            {html_content}
            <div class="footer">
                <p>© 2025 Aishwaryam Inn. All rights reserved.</p>
                <p>For support: aishwaryaminn@gmail.com | +91 9443224498</p>
            </div>
        </body>
        </html>
        """
        
        # Convert HTML to PDF
        with open(pdf_file, 'wb') as pdf:
            pisa.CreatePDF(full_html, pdf)
        
        return True

if __name__ == "__main__":
    # Get paths
    hotel_dir = Path(__file__).parent
    md_file = hotel_dir / "ADMIN_USER_GUIDE.md"
    pdf_file = hotel_dir / "ADMIN_USER_GUIDE.pdf"
    
    if not md_file.exists():
        print(f"Error: {md_file} not found!")
        exit(1)
    
    print(f"Converting {md_file} to PDF...")
    
    try:
        if markdown_to_pdf(str(md_file), str(pdf_file)):
            print(f"✓ PDF created successfully: {pdf_file}")
            print(f"File size: {pdf_file.stat().st_size / 1024:.2f} KB")
        else:
            print("Error: Failed to create PDF")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)
