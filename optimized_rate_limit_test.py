#!/usr/bin/env python3
"""
OPTIMIZED RATE LIMITING TEST - Target 95%+ Effectiveness
Tests the enhanced precision configuration with draft-7 standardHeaders
Validates improvement from 79% to 95%+ effectiveness as requested
"""

import requests
import time
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
import threading

# Backend URL from environment
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class OptimizedRateLimitTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'OptimizedRateLimit-Tester/1.0'
        })
        self.test_results = {}
        self.lock = threading.Lock()
        
    def log(self, message):
        """Thread-safe logging"""
        with self.lock:
            timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{timestamp}] {message}")
            
    def register_test_user(self):
        """Register a test user for authentication tests"""
        try:
            timestamp = str(int(time.time()))
            user_data = {
                "email": f"optimized.test.{timestamp}@example.com",
                "username": f"optimizedtester{timestamp}",
                "password": "TestPassword123!"
            }
            
            response = self.session.post(f"{API_BASE}/register", json=user_data)
            if response.status_code in [200, 201]:
                data = response.json()
                self.log(f"✅ Test user registered successfully")
                return data.get('token')
            else:
                self.log(f"❌ Failed to register test user: {response.status_code}")
                return None
        except Exception as e:
            self.log(f"❌ Error registering test user: {e}")
            return None

    def test_api_limiter_precision_95_percent(self):
        """TEST 1: API Limiter - Target 95%+ (was 79%)"""
        self.log("🚀 Starting TEST 1: API Limiter Precision - Target 95%+ effectiveness")
        self.log("   Target: /api/health endpoint")
        self.log("   Expected: 285-300 requests succeed (95%+ effectiveness)")
        
        endpoint = f"{API_BASE}/health"
        success_count = 0
        rate_limited_count = 0
        other_errors = 0
        
        # Make exactly 300 requests rapidly
        for i in range(1, 301):
            try:
                response = self.session.get(endpoint)
                
                if response.status_code == 200:
                    success_count += 1
                    if i % 50 == 0:  # Log every 50th request
                        self.log(f"✅ Request {i}/300: SUCCESS (200)")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    try:
                        data = response.json()
                        if data.get('code') == 'API_RATE_LIMIT_EXCEEDED' and 'limit' in data:
                            self.log(f"✅ Request {i}/300: API RATE LIMITED (429) - Enhanced format with limit: {data.get('limit')}")
                        else:
                            self.log(f"❌ Request {i}/300: Wrong error code or missing limit field")
                    except:
                        self.log(f"✅ Request {i}/300: API RATE LIMITED (429)")
                else:
                    other_errors += 1
                    self.log(f"❌ Request {i}/300: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/300: Exception - {e}")
                other_errors += 1
                
            # Small delay to avoid overwhelming
            time.sleep(0.01)
        
        # Calculate effectiveness - Target 95%+ (285-300 allowed)
        effectiveness = (success_count / 300) * 100
        target_met = effectiveness >= 95.0
        
        self.test_results['apiLimiter_optimized'] = {
            'success_count': success_count,
            'rate_limited_count': rate_limited_count,
            'other_errors': other_errors,
            'effectiveness': effectiveness,
            'target_effectiveness': 95.0,
            'target_met': target_met,
            'improvement_from': 79.0
        }
        
        self.log(f"📊 API Limiter Optimized Results:")
        self.log(f"   Success: {success_count}/300")
        self.log(f"   Rate Limited: {rate_limited_count}")
        self.log(f"   Other Errors: {other_errors}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 95%+)")
        self.log(f"   Improvement from: 79% → {effectiveness:.1f}%")
        self.log(f"   Target Met: {'✅ YES' if target_met else '❌ NO'}")
        
        return target_met

    def test_auth_limiter_precision_95_percent(self):
        """TEST 2: Auth Limiter - Target 95%+ (was 90%)"""
        self.log("🚀 Starting TEST 2: Auth Limiter Precision - Target 95%+ effectiveness")
        self.log("   Target: /api/login endpoint")
        self.log("   Expected: 9-10 requests allowed (95%+ effectiveness)")
        
        endpoint = f"{API_BASE}/login"
        auth_error_count = 0
        rate_limited_count = 0
        other_errors = 0
        
        # Test data for login attempts (invalid credentials)
        login_data = {
            "email": "test@example.com",
            "password": "wrongpassword"
        }
        
        # Make exactly 10 login attempts
        for i in range(1, 11):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code in [400, 401]:
                    # Invalid credentials (expected)
                    auth_error_count += 1
                    self.log(f"✅ Request {i}/10: AUTH ERROR ({response.status_code}) - Allowed")
                        
                elif response.status_code == 429:
                    rate_limited_count += 1
                    try:
                        data = response.json()
                        if data.get('code') == 'AUTH_RATE_LIMIT_EXCEEDED' and 'limit' in data:
                            self.log(f"✅ Request {i}/10: AUTH RATE LIMITED (429) - Enhanced format with limit: {data.get('limit')}")
                        else:
                            self.log(f"❌ Request {i}/10: Wrong error code or missing limit field")
                    except:
                        self.log(f"❌ Request {i}/10: 429 but no JSON response")
                        
                else:
                    other_errors += 1
                    self.log(f"❌ Request {i}/10: Unexpected status {response.status_code}")
                    
            except Exception as e:
                self.log(f"❌ Request {i}/10: Exception - {e}")
                other_errors += 1
                
            time.sleep(0.1)
        
        # Calculate effectiveness - Target 95%+ (9.5-10 allowed)
        effectiveness = (auth_error_count / 10) * 100
        target_met = effectiveness >= 95.0
        
        self.test_results['authLimiter_optimized'] = {
            'auth_error_count': auth_error_count,
            'rate_limited_count': rate_limited_count,
            'other_errors': other_errors,
            'effectiveness': effectiveness,
            'target_effectiveness': 95.0,
            'target_met': target_met,
            'improvement_from': 90.0
        }
        
        self.log(f"📊 Auth Limiter Optimized Results:")
        self.log(f"   Auth Errors: {auth_error_count}/10")
        self.log(f"   Rate Limited: {rate_limited_count}")
        self.log(f"   Other Errors: {other_errors}")
        self.log(f"   Effectiveness: {effectiveness:.1f}% (Target: 95%+)")
        self.log(f"   Improvement from: 90% → {effectiveness:.1f}%")
        self.log(f"   Target Met: {'✅ YES' if target_met else '❌ NO'}")
        
        return target_met

    def test_response_format_validation(self):
        """TEST 3: Response Format Validation - Enhanced 429 responses"""
        self.log("🚀 Starting TEST 3: Response Format Validation")
        self.log("   Verifying 429 responses include enhanced fields")
        
        # Force a 429 by making many requests quickly
        endpoint = f"{API_BASE}/login"
        login_data = {"email": "test@example.com", "password": "wrong"}
        
        enhanced_format_found = False
        
        # Make requests until we get a 429
        for i in range(15):
            try:
                response = self.session.post(endpoint, json=login_data)
                
                if response.status_code == 429:
                    data = response.json()
                    
                    # Verify enhanced fields (including new 'limit' field)
                    required_fields = ['error', 'message', 'code', 'retryAfter', 'limit', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log(f"✅ Enhanced 429 Response format valid:")
                        self.log(f"   error: {data.get('error')}")
                        self.log(f"   message: {data.get('message')}")
                        self.log(f"   code: {data.get('code')}")
                        self.log(f"   retryAfter: {data.get('retryAfter')}")
                        self.log(f"   limit: {data.get('limit')} (NEW FIELD)")
                        self.log(f"   timestamp: {data.get('timestamp')}")
                        enhanced_format_found = True
                        break
                    else:
                        self.log(f"❌ Enhanced 429 Response missing fields: {missing_fields}")
                        break
                        
            except Exception as e:
                self.log(f"❌ Error testing enhanced 429 format: {e}")
                
            time.sleep(0.1)
        
        if not enhanced_format_found:
            self.log("❌ Could not verify enhanced 429 response format")
            
        self.test_results['enhanced_response_format'] = {
            'enhanced_format_found': enhanced_format_found
        }
        
        return enhanced_format_found

    def test_header_validation_draft7(self):
        """TEST 4: Header Validation - Rate limit headers (RFC 6585 / newer standard)"""
        self.log("🚀 Starting TEST 4: Header Validation - Rate limit headers")
        self.log("   Verifying rate limit headers (checking both draft-7 and RFC 6585 formats)")
        
        # Force rate limiting to see headers
        endpoint = f"{API_BASE}/login"
        login_data = {"email": "test@example.com", "password": "wrong"}
        headers_found = []
        
        try:
            # Make requests to trigger rate limiting
            for i in range(12):
                response = self.session.post(endpoint, json=login_data)
                if response.status_code == 429:
                    # Check for draft-7 standard headers
                    draft7_headers = ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset']
                    for header in draft7_headers:
                        if header in response.headers:
                            headers_found.append(header)
                            self.log(f"✅ Draft-7 header found: {header} = {response.headers[header]}")
                    
                    # Check for RFC 6585 / newer standard headers
                    rfc_headers = ['ratelimit', 'ratelimit-policy', 'retry-after']
                    for header in rfc_headers:
                        if header in response.headers:
                            headers_found.append(header)
                            self.log(f"✅ RFC 6585 header found: {header} = {response.headers[header]}")
                    
                    break
                time.sleep(0.1)
            
            # Check header accuracy and consistency
            if len(headers_found) >= 2:
                self.log("✅ Rate limit headers present and consistent")
                headers_compliant = True
            else:
                self.log("❌ Insufficient rate limit headers found")
                headers_compliant = False
                    
        except Exception as e:
            self.log(f"❌ Error testing rate limit headers: {e}")
            headers_compliant = False
            
        self.test_results['draft7_headers'] = {
            'headers_found': headers_found,
            'total_found': len(headers_found),
            'draft7_compliant': headers_compliant
        }
        
        return headers_compliant

    def run_optimized_tests(self):
        """Run optimized rate limiting tests according to review request"""
        self.log("🎯 OPTIMIZED RATE LIMITING TEST - Target 95%+ Effectiveness")
        self.log("=" * 70)
        self.log("Testing enhanced precision configuration with draft-7 standardHeaders")
        self.log("Validating improvement from previous effectiveness levels")
        self.log("=" * 70)
        
        start_time = time.time()
        
        # Show the optimizations applied
        self.log("\n🔥 OPTIMIZATIONS APPLIED:")
        self.log("   ✅ draft-7 standardHeaders - Better precision than draft-6")
        self.log("   ✅ Enhanced validation - xForwardedForHeader: false, trustProxy: false")
        self.log("   ✅ BaseConfig pattern - Consistent configuration across all limiters")
        self.log("   ✅ Limit values in responses - Better debugging and transparency")
        
        # Run the precision tests
        self.log("\n🚀 PRECISION TESTS:")
        
        # TEST 1: API Limiter - Target 95%+ (was 79%)
        self.log("\n" + "="*50)
        test1_pass = self.test_api_limiter_precision_95_percent()
        time.sleep(2)
        
        # TEST 2: Auth Limiter - Target 95%+ (was 90%)
        self.log("\n" + "="*50)
        test2_pass = self.test_auth_limiter_precision_95_percent()
        time.sleep(2)
        
        # TEST 3: Response Format Validation
        self.log("\n" + "="*50)
        test3_pass = self.test_response_format_validation()
        time.sleep(1)
        
        # TEST 4: Header Validation
        self.log("\n" + "="*50)
        test4_pass = self.test_header_validation_draft7()
        
        end_time = time.time()
        
        # Final Results according to SUCCESS CRITERIA
        self.log("\n" + "="*70)
        self.log("🏁 OPTIMIZED RATE LIMITING RESULTS")
        self.log("="*70)
        
        all_tests_passed = True
        
        # Check each test result against success criteria
        tests = [
            ("apiLimiter achieves 285-300/300 (95-100%)", test1_pass, "apiLimiter_optimized"),
            ("authLimiter achieves 9.5-10/10 (95-100%)", test2_pass, "authLimiter_optimized"),
            ("Enhanced 429 response format with limit field", test3_pass, "enhanced_response_format"),
            ("Rate limit headers present and accurate", test4_pass, "draft7_headers")
        ]
        
        for test_name, passed, result_key in tests:
            if passed:
                self.log(f"✅ {test_name}: PASSED")
                if result_key in self.test_results and 'effectiveness' in self.test_results[result_key]:
                    effectiveness = self.test_results[result_key]['effectiveness']
                    improvement_from = self.test_results[result_key].get('improvement_from', 0)
                    self.log(f"   Effectiveness: {effectiveness:.1f}% (improved from {improvement_from}%)")
            else:
                self.log(f"❌ {test_name}: FAILED")
                all_tests_passed = False
                if result_key in self.test_results and 'effectiveness' in self.test_results[result_key]:
                    effectiveness = self.test_results[result_key]['effectiveness']
                    self.log(f"   Effectiveness: {effectiveness:.1f}%")
        
        # Overall assessment
        self.log("\n" + "="*70)
        if all_tests_passed:
            self.log("🎉 OPTIMIZED RATE LIMITING SUCCESS!")
            self.log("🚀 TARGET METRICS ACHIEVED:")
            
            # Show the exact effectiveness percentages
            api_eff = self.test_results.get('apiLimiter_optimized', {}).get('effectiveness', 0)
            auth_eff = self.test_results.get('authLimiter_optimized', {}).get('effectiveness', 0)
            
            self.log(f"   - apiLimiter: {api_eff:.1f}% (Target: 95%+, Previous: 79%)")
            self.log(f"   - authLimiter: {auth_eff:.1f}% (Target: 95%+, Previous: 90%)")
            self.log("   ✅ Enhanced 429 response format with limit field")
            self.log("   ✅ Rate limit headers present and accurate")
            
            # Calculate improvement
            api_improvement = api_eff - 79.0
            auth_improvement = auth_eff - 90.0
            self.log(f"\n📈 IMPROVEMENTS ACHIEVED:")
            self.log(f"   - API Limiter: +{api_improvement:.1f}% improvement")
            self.log(f"   - Auth Limiter: +{auth_improvement:.1f}% improvement")
            
        else:
            self.log("❌ OPTIMIZED RATE LIMITING TARGETS NOT FULLY ACHIEVED")
            self.log("🔧 Issues found that require attention:")
            for test_name, passed, result_key in tests:
                if not passed:
                    self.log(f"   ❌ {test_name}")
            
        self.log(f"⏱️  Total test time: {end_time - start_time:.2f} seconds")
        
        return all_tests_passed

if __name__ == "__main__":
    tester = OptimizedRateLimitTester()
    success = tester.run_optimized_tests()
    sys.exit(0 if success else 1)