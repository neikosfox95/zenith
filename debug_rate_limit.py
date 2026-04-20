#!/usr/bin/env python3
"""
Focused Rate Limiting Debug Test
"""

import requests
import time
import json

BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_specific_endpoint():
    """Test a specific endpoint to understand rate limiting behavior"""
    session = requests.Session()
    
    # Test different endpoints
    endpoints = [
        f"{BACKEND_URL}/api/health",  # Should be affected by both speedLimiter and apiLimiter but skipped
        f"{BACKEND_URL}/health",      # Should be affected by speedLimiter only but skipped
        f"{BACKEND_URL}/api/nonexistent",  # Should be affected by both limiters, not skipped
    ]
    
    for endpoint in endpoints:
        print(f"\n🔍 Testing endpoint: {endpoint}")
        
        # Make 15 rapid requests
        for i in range(1, 16):
            try:
                response = session.get(endpoint)
                print(f"Request {i}: Status {response.status_code}")
                
                # Print headers for first few requests
                if i <= 3:
                    headers = dict(response.headers)
                    rate_headers = {k: v for k, v in headers.items() if 'rate' in k.lower() or 'limit' in k.lower()}
                    if rate_headers:
                        print(f"  Rate headers: {rate_headers}")
                    else:
                        print(f"  No rate limit headers found")
                
                if response.status_code == 429:
                    try:
                        data = response.json()
                        print(f"  429 Response: {data}")
                    except:
                        print(f"  429 Response (non-JSON): {response.text}")
                    break
                    
            except Exception as e:
                print(f"Request {i}: Exception - {e}")
                
            time.sleep(0.05)  # Small delay
        
        time.sleep(2)  # Pause between endpoint tests

def test_auth_endpoint():
    """Test auth endpoint specifically"""
    session = requests.Session()
    endpoint = f"{API_BASE}/login"
    
    print(f"\n🔍 Testing auth endpoint: {endpoint}")
    
    login_data = {"email": "test@example.com", "password": "wrong"}
    
    for i in range(1, 12):
        try:
            response = session.post(endpoint, json=login_data)
            print(f"Request {i}: Status {response.status_code}")
            
            if response.status_code == 429:
                try:
                    data = response.json()
                    print(f"  429 Response: {data}")
                except:
                    print(f"  429 Response (non-JSON): {response.text}")
                break
                
        except Exception as e:
            print(f"Request {i}: Exception - {e}")
            
        time.sleep(0.1)

if __name__ == "__main__":
    print("🔧 RATE LIMITING DEBUG TEST")
    print("=" * 50)
    
    test_specific_endpoint()
    test_auth_endpoint()