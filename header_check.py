#!/usr/bin/env python3
"""
Quick header check for rate limiting
"""

import requests

BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def check_headers():
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"Status: {response.status_code}")
        print("Headers:")
        for header, value in response.headers.items():
            if 'rate' in header.lower() or 'limit' in header.lower():
                print(f"  {header}: {value}")
        
        print("\nAll headers:")
        for header, value in response.headers.items():
            print(f"  {header}: {value}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_headers()