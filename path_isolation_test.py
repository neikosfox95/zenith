#!/usr/bin/env python3
"""
PATH ISOLATION TEST - Auth Limiter
Testing that /api/login and /api/register have separate rate limit counters
"""

import requests
import time
import json
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def log(message):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

def test_path_isolation():
    """Test that /api/login and /api/register have separate counters"""
    log("🚀 PATH ISOLATION TEST - Fresh Backend State")
    log("Testing that /api/login and /api/register have separate rate limit counters")
    
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'User-Agent': 'PathIsolation-Tester/1.0'
    })
    
    # Test data
    login_data = {"email": "pathtest@example.com", "password": "wrong123"}
    
    # Phase 1: Make 10 requests to /api/login
    log("Phase 1: Testing /api/login (10 requests)")
    login_endpoint = f"{API_BASE}/login"
    login_allowed = 0
    
    for i in range(1, 11):
        try:
            response = session.post(login_endpoint, json=login_data)
            if response.status_code in [400, 401]:
                login_allowed += 1
                log(f"✅ Login Request {i}/10: ALLOWED ({response.status_code})")
            elif response.status_code == 429:
                log(f"❌ Login Request {i}/10: UNEXPECTED RATE LIMIT")
                break
        except Exception as e:
            log(f"❌ Login Request {i}/10: Exception - {e}")
        time.sleep(0.1)
    
    # Verify 11th login request gets rate limited
    log("Testing 11th login request (should be rate limited)")
    try:
        response = session.post(login_endpoint, json=login_data)
        if response.status_code == 429:
            log("✅ 11th login request: RATE LIMITED as expected")
            login_11th_limited = True
        else:
            log(f"❌ 11th login request: NOT rate limited ({response.status_code})")
            login_11th_limited = False
    except:
        login_11th_limited = False
    
    # Phase 2: Test /api/register with separate counter
    log("\nPhase 2: Testing /api/register (should have separate counter)")
    register_endpoint = f"{API_BASE}/register"
    register_allowed = 0
    
    for i in range(1, 11):
        try:
            # Use unique email each time to avoid duplicate user errors
            unique_register_data = {
                "email": f"pathtest{i}@example.com",
                "username": f"pathtest{i}",
                "password": "Test123!"
            }
            response = session.post(register_endpoint, json=unique_register_data)
            if response.status_code in [200, 201, 400]:  # 400 for validation errors
                register_allowed += 1
                log(f"✅ Register Request {i}/10: ALLOWED ({response.status_code})")
            elif response.status_code == 429:
                log(f"❌ Register Request {i}/10: UNEXPECTED RATE LIMIT")
                break
        except Exception as e:
            log(f"❌ Register Request {i}/10: Exception - {e}")
        time.sleep(0.1)
    
    # Verify 11th register request gets rate limited
    log("Testing 11th register request (should be rate limited)")
    try:
        unique_register_data = {
            "email": "pathtest11@example.com",
            "username": "pathtest11",
            "password": "Test123!"
        }
        response = session.post(register_endpoint, json=unique_register_data)
        if response.status_code == 429:
            log("✅ 11th register request: RATE LIMITED as expected")
            register_11th_limited = True
        else:
            log(f"❌ 11th register request: NOT rate limited ({response.status_code})")
            register_11th_limited = False
    except:
        register_11th_limited = False
    
    # Results
    log("\n📊 PATH ISOLATION TEST RESULTS:")
    log(f"   Login endpoint: {login_allowed}/10 allowed, 11th limited: {login_11th_limited}")
    log(f"   Register endpoint: {register_allowed}/10 allowed, 11th limited: {register_11th_limited}")
    
    path_isolation_success = (
        login_allowed == 10 and 
        register_allowed == 10 and 
        login_11th_limited and 
        register_11th_limited
    )
    
    log(f"   PATH ISOLATION SUCCESS: {path_isolation_success}")
    
    if path_isolation_success:
        log("🎉 PATH ISOLATION WORKING CORRECTLY!")
        log("   ✅ /api/login and /api/register have separate rate limit counters")
        log("   ✅ Enhanced key format: auth:IP:userId:path working as expected")
    else:
        log("❌ PATH ISOLATION FAILED")
        if login_allowed != 10:
            log(f"   Issue: Login endpoint only allowed {login_allowed}/10 requests")
        if register_allowed != 10:
            log(f"   Issue: Register endpoint only allowed {register_allowed}/10 requests")
        if not login_11th_limited:
            log("   Issue: 11th login request was not rate limited")
        if not register_11th_limited:
            log("   Issue: 11th register request was not rate limited")
    
    return path_isolation_success

if __name__ == "__main__":
    success = test_path_isolation()
    exit(0 if success else 1)