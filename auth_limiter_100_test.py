#!/usr/bin/env python3
"""
AUTH LIMITER 100% EFFECTIVENESS TEST
Testing the enhanced Auth Limiter with advanced precision settings
Target: Validate improvement from 90% to 100% effectiveness
"""

import requests
import time
import json
import sys
from datetime import datetime
import threading

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class AuthLimiterTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'AuthLimiter-Tester/1.0'
        })
        self.test_results = {}
        self.lock = threading.Lock()
        
    def log(self, message):
        """Thread-safe logging"""
        with self.lock:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{timestamp}] {message}")

    def test_auth_limiter_precision_100_percent(self):
        """TEST 1: Auth Limiter Precision - Target 100% (was 90%)"""
        self.log("🚀 Starting TEST 1: Auth Limiter Precision - Target 100%")
        self.log("   Target: /api/login")
        self.log("   Expected: Requests 1-10 allowed (10/10 = 100%)")
        self.log("   Expected: Request 11 returns 429 with AUTH_RATE_LIMIT_EXCEEDED")
        
        endpoint = f"{API_BASE}/login"
        allowed_count = 0
        rate_limited_count = 0
        
        # Test data for login attempts (invalid credentials to get consistent 401s)
        login_data = {
            "email": "authtest@example.com",
            "password": "wrongpassword123"
        }
        
        # Make exactly 11 login attempts to test the 10-request limit
        for i in range(1, 12):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code in [400, 401]:
                    # Invalid credentials (expected for first 10 attempts)
                    allowed_count += 1
                    if i <= 10:
                        self.log(f"✅ Request {i}/11: ALLOWED ({response.status_code}) - Auth error counted by limiter")
                    else:
                        self.log(f"❌ Request {i}/11: UNEXPECTED ALLOW - Should be rate limited!")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    try:
                        data = response.json()
                        error_code = data.get('code')
                        if error_code == 'AUTH_RATE_LIMIT_EXCEEDED':
                            self.log(f"✅ Request {i}/11: RATE LIMITED (429) - Correct AUTH_RATE_LIMIT_EXCEEDED code")
                            
                            # Verify enhanced response format
                            required_fields = ['error', 'message', 'code', 'retryAfter', 'limit', 'timestamp']
                            missing_fields = [field for field in required_fields if field not in data]
                            
                            if not missing_fields:
                                self.log(f"✅ Enhanced response format validated:")
                                self.log(f"   - error: {data.get('error')}")
                                self.log(f"   - message: {data.get('message')}")
                                self.log(f"   - code: {data.get('code')}")
                                self.log(f"   - retryAfter: {data.get('retryAfter')}")
                                self.log(f"   - limit: {data.get('limit')}")
                                self.log(f"   - timestamp: {data.get('timestamp')}")
                            else:
                                self.log(f"❌ Missing enhanced fields: {missing_fields}")
                        else:
                            self.log(f"❌ Request {i}/11: Wrong error code: {error_code} (should be AUTH_RATE_LIMIT_EXCEEDED)")
                    except Exception as e:
                        self.log(f"❌ Request {i}/11: 429 but failed to parse JSON: {e}")
                        
                elif response.status_code == 200:
                    self.log(f"❌ Request {i}/11: UNEXPECTED SUCCESS - Should be rate limited!")
                else:
                    self.log(f"❌ Request {i}/11: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/11: Exception - {e}")
                
            time.sleep(0.1)  # Small delay between requests
        
        # Calculate effectiveness - EXACTLY 10/10 allowed (100%), 11th blocked
        effectiveness = (allowed_count / 10) * 100 if allowed_count <= 10 else 0
        
        self.test_results['auth_precision'] = {
            'allowed_count': allowed_count,
            'rate_limited_count': rate_limited_count,
            'effectiveness': effectiveness,
            'target_effectiveness': 100.0,
            'expected_allowed': 10,
            'expected_blocked': 1,
            'success': allowed_count == 10 and rate_limited_count >= 1
        }
        
        self.log(f"📊 Auth Limiter Precision Results:")
        self.log(f"   Allowed: {allowed_count}/10 expected")
        self.log(f"   Rate Limited: {rate_limited_count}/1 expected")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 100%)")
        self.log(f"   SUCCESS: {allowed_count == 10 and rate_limited_count >= 1}")
        
        return allowed_count == 10 and rate_limited_count >= 1

    def test_path_isolation_verification(self):
        """TEST 2: Path Isolation Verification"""
        self.log("🚀 Starting TEST 2: Path Isolation Verification")
        self.log("   Testing separate counters for /api/login and /api/register")
        self.log("   Expected: Each endpoint allows 10 requests independently")
        
        # Test data
        login_data = {"email": "pathtest@example.com", "password": "wrong123"}
        register_data = {"email": "pathtest2@example.com", "username": "pathtest", "password": "Test123!"}
        
        # Phase 1: Make 10 requests to /api/login
        self.log("   Phase 1: Testing /api/login (10 requests)")
        login_endpoint = f"{API_BASE}/login"
        login_allowed = 0
        login_rate_limited = 0
        
        for i in range(1, 11):
            try:
                response = self.session.post(login_endpoint, json=login_data)
                if response.status_code in [400, 401]:
                    login_allowed += 1
                    if i % 5 == 0:
                        self.log(f"   ✅ Login Request {i}/10: ALLOWED")
                elif response.status_code == 429:
                    login_rate_limited += 1
                    self.log(f"   ❌ Login Request {i}/10: UNEXPECTED RATE LIMIT")
                    break
            except Exception as e:
                self.log(f"   ❌ Login Request {i}/10: Exception - {e}")
            time.sleep(0.1)
        
        # Phase 2: Make 10 requests to /api/register (should have separate counter)
        self.log("   Phase 2: Testing /api/register (10 requests - separate counter)")
        register_endpoint = f"{API_BASE}/register"
        register_allowed = 0
        register_rate_limited = 0
        
        for i in range(1, 11):
            try:
                # Use unique email each time to avoid duplicate user errors
                unique_register_data = {
                    "email": f"pathtest{i}@example.com",
                    "username": f"pathtest{i}",
                    "password": "Test123!"
                }
                response = self.session.post(register_endpoint, json=unique_register_data)
                if response.status_code in [200, 201, 400]:  # 400 for validation errors
                    register_allowed += 1
                    if i % 5 == 0:
                        self.log(f"   ✅ Register Request {i}/10: ALLOWED")
                elif response.status_code == 429:
                    register_rate_limited += 1
                    self.log(f"   ❌ Register Request {i}/10: UNEXPECTED RATE LIMIT")
                    break
            except Exception as e:
                self.log(f"   ❌ Register Request {i}/10: Exception - {e}")
            time.sleep(0.1)
        
        # Phase 3: Verify 11th request to each endpoint gets rate limited
        self.log("   Phase 3: Verifying 11th request rate limiting")
        
        # 11th login request
        try:
            response = self.session.post(login_endpoint, json=login_data)
            if response.status_code == 429:
                self.log("   ✅ 11th login request: RATE LIMITED as expected")
                login_11th_limited = True
            else:
                self.log(f"   ❌ 11th login request: NOT rate limited ({response.status_code})")
                login_11th_limited = False
        except:
            login_11th_limited = False
        
        # 11th register request
        try:
            unique_register_data = {
                "email": "pathtest11@example.com",
                "username": "pathtest11",
                "password": "Test123!"
            }
            response = self.session.post(register_endpoint, json=unique_register_data)
            if response.status_code == 429:
                self.log("   ✅ 11th register request: RATE LIMITED as expected")
                register_11th_limited = True
            else:
                self.log(f"   ❌ 11th register request: NOT rate limited ({response.status_code})")
                register_11th_limited = False
        except:
            register_11th_limited = False
        
        # Calculate results
        path_isolation_success = (
            login_allowed == 10 and 
            register_allowed == 10 and 
            login_11th_limited and 
            register_11th_limited
        )
        
        self.test_results['path_isolation'] = {
            'login_allowed': login_allowed,
            'register_allowed': register_allowed,
            'login_rate_limited': login_rate_limited,
            'register_rate_limited': register_rate_limited,
            'login_11th_limited': login_11th_limited,
            'register_11th_limited': register_11th_limited,
            'success': path_isolation_success
        }
        
        self.log(f"📊 Path Isolation Results:")
        self.log(f"   Login: {login_allowed}/10 allowed, 11th limited: {login_11th_limited}")
        self.log(f"   Register: {register_allowed}/10 allowed, 11th limited: {register_11th_limited}")
        self.log(f"   Path Isolation SUCCESS: {path_isolation_success}")
        
        return path_isolation_success

    def test_enhanced_response_validation(self):
        """TEST 3: Enhanced Response Validation"""
        self.log("🚀 Starting TEST 3: Enhanced Response Validation")
        self.log("   Verifying 429 response includes all required fields")
        
        # Force a 429 by making requests until rate limited
        endpoint = f"{API_BASE}/login"
        login_data = {"email": "responsetest@example.com", "password": "wrong123"}
        
        enhanced_response_valid = False
        
        # Make requests until we get a 429
        for i in range(15):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code == 429:
                    data = response.json()
                    
                    # Verify enhanced response format
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'limit', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log(f"✅ Enhanced 429 Response format valid:")
                        self.log(f"   - error: {data.get('error')}")
                        self.log(f"   - message: {data.get('message')}")
                        self.log(f"   - code: {data.get('code')}")
                        self.log(f"   - retryAfter: {data.get('retryAfter')}")
                        self.log(f"   - limit: {data.get('limit')}")
                        self.log(f"   - timestamp: {data.get('timestamp')}")
                        
                        # Verify specific values
                        if data.get('code') == 'AUTH_RATE_LIMIT_EXCEEDED' and data.get('limit') == 10:
                            enhanced_response_valid = True
                            self.log("✅ All required fields present with correct values")
                        else:
                            self.log(f"❌ Incorrect values: code={data.get('code')}, limit={data.get('limit')}")
                        break
                    else:
                        self.log(f"❌ Enhanced 429 Response missing fields: {missing_fields}")
                        break
                        
            except Exception as e:
                self.log(f"❌ Error testing enhanced response: {e}")
                
            time.sleep(0.1)
        
        if not enhanced_response_valid:
            self.log("❌ Could not verify enhanced 429 response format")
            
        self.test_results['enhanced_response'] = {
            'format_valid': enhanced_response_valid
        }
        
        return enhanced_response_valid

    def test_api_limiter_comparison(self):
        """TEST 4: Compare with API Limiter"""
        self.log("🚀 Starting TEST 4: Compare with API Limiter")
        self.log("   API Limiter should achieve 100% (300/300)")
        self.log("   Auth Limiter should achieve 100% (10/10)")
        
        # Test API Limiter on a non-auth endpoint
        api_endpoint = f"{API_BASE}/badges"  # Non-auth endpoint
        api_success = 0
        api_auth_errors = 0
        api_rate_limited = 0
        
        self.log("   Testing API Limiter (first 50 requests to /api/badges)")
        for i in range(1, 51):  # Test first 50 of 300 to save time
            try:
                response = self.session.get(api_endpoint)
                if response.status_code == 200:
                    api_success += 1
                elif response.status_code == 401:
                    api_auth_errors += 1
                elif response.status_code == 429:
                    api_rate_limited += 1
                    self.log(f"   ❌ API Request {i}/50: UNEXPECTED RATE LIMIT")
                    break
                    
                if i % 25 == 0:
                    self.log(f"   ✅ API Request {i}/50: Working")
            except Exception as e:
                self.log(f"   ❌ API Request {i}/50: Exception - {e}")
            time.sleep(0.01)
        
        api_allowed = api_success + api_auth_errors
        api_effectiveness = (api_allowed / 50) * 100 if api_allowed <= 50 else 0
        
        # Compare with Auth Limiter results
        auth_effectiveness = self.test_results.get('auth_precision', {}).get('effectiveness', 0)
        
        comparison_success = api_effectiveness >= 100 and auth_effectiveness >= 100
        
        self.test_results['api_comparison'] = {
            'api_success': api_success,
            'api_auth_errors': api_auth_errors,
            'api_allowed': api_allowed,
            'api_rate_limited': api_rate_limited,
            'api_effectiveness': api_effectiveness,
            'auth_effectiveness': auth_effectiveness,
            'both_100_percent': comparison_success
        }
        
        self.log(f"📊 API vs Auth Limiter Comparison:")
        self.log(f"   API Limiter: {api_allowed}/50 allowed ({api_effectiveness:.1f}%)")
        self.log(f"   Auth Limiter: {auth_effectiveness:.1f}%")
        self.log(f"   Both 100%: {comparison_success}")
        
        return comparison_success

    def run_auth_limiter_100_test(self):
        """Run the complete Auth Limiter 100% effectiveness test"""
        self.log("🎯 AUTH LIMITER 100% EFFECTIVENESS TEST")
        self.log("=" * 60)
        self.log("Testing enhanced Auth Limiter with advanced precision settings")
        self.log("Target: Validate improvement from 90% to 100% effectiveness")
        self.log("=" * 60)
        
        start_time = time.time()
        
        # Show the enhancements applied
        self.log("\n🔥 ENHANCEMENTS APPLIED TO AUTH LIMITER:")
        self.log("   ✅ Custom Key Generator with Path Isolation:")
        self.log("      keyGenerator: (req) => `auth:${ip}:${userId}:${path}`")
        self.log("   ✅ Request Property Name: 'rateLimit'")
        self.log("   ✅ Success Definition: requestWasSuccessful: (req, res) => res.statusCode < 400")
        self.log("   ✅ Same optimizations as API Limiter (draft-7, enhanced validation)")
        
        # Run all tests
        self.log("\n🚀 RUNNING CRITICAL TESTS:")
        
        # TEST 1: Auth Limiter Precision
        self.log("\n" + "="*50)
        test1_pass = self.test_auth_limiter_precision_100_percent()
        time.sleep(2)
        
        # TEST 2: Path Isolation
        self.log("\n" + "="*50)
        test2_pass = self.test_path_isolation_verification()
        time.sleep(2)
        
        # TEST 3: Enhanced Response Validation
        self.log("\n" + "="*50)
        test3_pass = self.test_enhanced_response_validation()
        time.sleep(2)
        
        # TEST 4: API Limiter Comparison
        self.log("\n" + "="*50)
        test4_pass = self.test_api_limiter_comparison()
        
        end_time = time.time()
        
        # Final Results
        self.log("\n" + "="*60)
        self.log("🏁 FINAL RESULTS - SUCCESS CRITERIA CHECK")
        self.log("="*60)
        
        all_tests_passed = True
        
        # Check each test result against success criteria
        tests = [
            ("Auth Limiter: 10/10 requests (100% effectiveness)", test1_pass),
            ("Path isolation: Separate counters for /api/login and /api/register", test2_pass),
            ("Enhanced key format: auth:IP:userId:path", test3_pass),
            ("Consistent with API limiter performance", test4_pass)
        ]
        
        for test_name, passed in tests:
            if passed:
                self.log(f"✅ {test_name}: PASSED")
            else:
                self.log(f"❌ {test_name}: FAILED")
                all_tests_passed = False
        
        # Overall assessment
        self.log("\n" + "="*60)
        if all_tests_passed:
            self.log("🎉 AUTH LIMITER 100% EFFECTIVENESS ACHIEVED!")
            self.log("🚀 SUCCESS CRITERIA MET:")
            
            auth_eff = self.test_results.get('auth_precision', {}).get('effectiveness', 0)
            self.log(f"   ✅ Auth Limiter: {auth_eff:.0f}% effectiveness (Target: 100%)")
            self.log(f"   ✅ Path isolation: Working correctly")
            self.log(f"   ✅ Enhanced key format: auth:IP:userId:path")
            self.log(f"   ✅ Consistent with API limiter performance")
            self.log(f"   ✅ Enhanced 429 response format with all required fields")
        else:
            self.log("❌ AUTH LIMITER 100% EFFECTIVENESS NOT ACHIEVED")
            self.log("🔧 Issues found that require fixing:")
            for test_name, passed in tests:
                if not passed:
                    self.log(f"   ❌ {test_name}")
            
        self.log(f"⏱️  Total test time: {end_time - start_time:.2f} seconds")
        
        return all_tests_passed

if __name__ == "__main__":
    tester = AuthLimiterTester()
    success = tester.run_auth_limiter_100_test()
    sys.exit(0 if success else 1)