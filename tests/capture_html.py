#!/usr/bin/env python3
"""
Script to capture HTML from remote sites for testing.
Usage: python tests/capture_html.py
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
from bs4 import BeautifulSoup
from scraper.config import CSI_LIST, FIASP_URL, BASE_CSI_BERGAMO


def capture_csi_list():
    """Capture CSI list page."""
    print("📥 Capturing CSI list page...")
    try:
        resp = requests.get(CSI_LIST, timeout=10)
        resp.raise_for_status()
        
        fixtures_dir = Path(__file__).parent / "fixtures"
        fixtures_dir.mkdir(exist_ok=True)
        
        output_file = fixtures_dir / "csi_list.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(resp.text)
        
        print(f"✅ Saved to {output_file}")
        return resp.text
    except Exception as e:
        print(f"❌ Error capturing CSI list: {e}")
        return None


def capture_csi_detail():
    """Capture first CSI detail page."""
    print("📥 Capturing CSI detail page...")
    try:
        # Get list page first
        resp = requests.get(CSI_LIST, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Find first event link
        lista = soup.find("ul", class_="latestnews-items")
        if not lista:
            print("⚠️ No event list found")
            return None
        
        first_li = lista.find("li")
        if not first_li:
            print("⚠️ No events found")
            return None
        
        a = first_li.find("a", href=True)
        if not a:
            print("⚠️ No link found")
            return None
        
        detail_url = BASE_CSI_BERGAMO + a["href"]
        print(f"📡 Fetching {detail_url}")
        
        detail_resp = requests.get(detail_url, timeout=10)
        detail_resp.raise_for_status()
        
        fixtures_dir = Path(__file__).parent / "fixtures"
        output_file = fixtures_dir / "csi_detail.html"
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(detail_resp.text)
        
        print(f"✅ Saved to {output_file}")
        return detail_resp.text
    except Exception as e:
        print(f"❌ Error capturing CSI detail: {e}")
        return None


def capture_fiasp():
    """Capture FIASP events page."""
    print("📥 Capturing FIASP page...")
    try:
        resp = requests.get(FIASP_URL, timeout=10)
        resp.raise_for_status()
        
        fixtures_dir = Path(__file__).parent / "fixtures"
        fixtures_dir.mkdir(exist_ok=True)
        
        output_file = fixtures_dir / "fiasp_events.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(resp.text)
        
        print(f"✅ Saved to {output_file}")
        return resp.text
    except Exception as e:
        print(f"❌ Error capturing FIASP: {e}")
        return None


def analyze_html(html, source_name):
    """Analyze captured HTML and show key elements."""
    if not html:
        return
    
    print(f"\n🔍 Analyzing {source_name}...")
    soup = BeautifulSoup(html, "html.parser")
    
    print(f"   Total length: {len(html)} characters")
    print(f"   Title: {soup.title.string if soup.title else 'No title'}")
    
    # Count key elements
    tables = soup.find_all("table")
    divs = soup.find_all("div")
    lists = soup.find_all("ul")
    
    print(f"   Tables: {len(tables)}")
    print(f"   Divs: {len(divs)}")
    print(f"   Lists: {len(lists)}")


def main():
    """Main function to capture all HTML fixtures."""
    print("🚀 Capturing HTML fixtures for testing\n")
    print("=" * 60)
    
    # Capture CSI
    csi_list_html = capture_csi_list()
    analyze_html(csi_list_html, "CSI List")
    
    print("\n" + "=" * 60)
    csi_detail_html = capture_csi_detail()
    analyze_html(csi_detail_html, "CSI Detail")
    
    print("\n" + "=" * 60)
    fiasp_html = capture_fiasp()
    analyze_html(fiasp_html, "FIASP")
    
    print("\n" + "=" * 60)
    print("✨ Done! Check tests/fixtures/ directory")
    print("\nTo use in tests:")
    print("  pytest tests/test_csi_scraper.py -v")
    print("  pytest tests/test_fiasp_scraper.py -v")


if __name__ == "__main__":
    main()
