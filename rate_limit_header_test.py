#!/usr/bin/env python3
"""
Test to trigger rate limiting and check headers
"""

import requests
import time

BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_rate_limit_headers():
    session = requests.Session()
    
    # Make requests to trigger auth rate limiting
    login_data = {"email": "test@example.com", "password": "wrong"}
    
    print("Making requests to trigger rate limiting...")
    
    for i in range(12):
        try:
            response = session.post(f"{API_BASE}/login", json=login_data)
            print(f"Request {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print("Rate limit triggered! Checking headers:")
                for header, value in response.headers.items():
                    if 'rate' in header.lower() or 'limit' in header.lower():
                        print(f"  {header}: {value}")
                
                print("\nAll headers:")
                for header, value in response.headers.items():
                    print(f"  {header}: {value}")
                break
                
        except Exception as e:
            print(f"Error: {e}")
            
        time.sleep(0.1)

if __name__ == "__main__":
    test_rate_limit_headers()