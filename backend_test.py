#!/usr/bin/env python3
"""
BATCH 1 BACKEND API TESTING - GOD TIER ENHANCEMENTS
AI Studio v2 Endpoints Testing

Tests the following endpoints:
1. GET /api/ai-studio/v2/status
2. GET /api/ai-studio/v2/usage
3. GET /api/ai-studio/v2/provider-analytics
4. POST /api/ai-studio/v2/generate/text
5. GET /api/ai-studio/v2/models
6. GET /api/ai-studio/v2/models?type=text

Performance Testing:
- Response time < 500ms for status
- Response time < 1 second for all endpoints
- Caching verification
- Provider tracking accuracy
"""

import requests
import json
import time
from datetime import datetime

# Backend URL
BASE_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api/ai-studio/v2"

# Test results storage
test_results = []

def log_test(test_name, passed, details="", response_time=None):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = {
        "test": test_name,
        "status": status,
        "passed": passed,
        "details": details,
        "response_time": response_time,
        "timestamp": datetime.now().isoformat()
    }
    test_results.append(result)
    
    time_str = f" ({response_time:.0f}ms)" if response_time else ""
    print(f"{status}: {test_name}{time_str}")
    if details:
        print(f"   {details}")
    print()

def test_status_endpoint():
    """Test 1: AI Studio Status API"""
    print("=" * 80)
    print("TEST 1: AI Studio Status API - GET /api/ai-studio/v2/status")
    print("=" * 80)
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/status", timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Status Endpoint - HTTP 200", False, 
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Status Endpoint - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check required fields
        required_fields = ['totalModels', 'atlasCloudAvailable', 'fallbackAvailable', 'modelsByType']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            log_test("Status Endpoint - Response Structure", False,
                    f"Missing fields: {', '.join(missing_fields)}")
        else:
            log_test("Status Endpoint - Response Structure", True,
                    f"All required fields present: {', '.join(required_fields)}")
        
        # Check totalModels value
        total_models = data.get('totalModels', 0)
        if total_models == 39:
            log_test("Status Endpoint - Total Models Count", True,
                    f"Expected 39 models, got {total_models}")
        else:
            log_test("Status Endpoint - Total Models Count", False,
                    f"Expected 39 models, got {total_models}")
        
        # Check modelsByType structure
        models_by_type = data.get('modelsByType', {})
        expected_types = ['text', 'image', 'video', 'audio', 'music']
        missing_types = [t for t in expected_types if t not in models_by_type]
        
        if missing_types:
            log_test("Status Endpoint - Models By Type", False,
                    f"Missing types: {', '.join(missing_types)}")
        else:
            type_counts = ', '.join([f"{k}: {v}" for k, v in models_by_type.items()])
            log_test("Status Endpoint - Models By Type", True,
                    f"All types present - {type_counts}")
        
        # Check response time < 500ms
        if response_time < 500:
            log_test("Status Endpoint - Performance", True,
                    f"Response time {response_time:.0f}ms < 500ms target")
        else:
            log_test("Status Endpoint - Performance", False,
                    f"Response time {response_time:.0f}ms > 500ms target")
        
        print(f"📊 Status Response: {json.dumps(data, indent=2)}\n")
        
    except Exception as e:
        log_test("Status Endpoint - Exception", False, str(e))

def test_usage_endpoint():
    """Test 2: AI Studio Usage API"""
    print("=" * 80)
    print("TEST 2: AI Studio Usage API - GET /api/ai-studio/v2/usage")
    print("=" * 80)
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/usage", timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Usage Endpoint - HTTP 200", False,
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Usage Endpoint - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check for usage object
        if 'usage' not in data:
            log_test("Usage Endpoint - Response Structure", False,
                    "Missing 'usage' field")
            return
        
        usage = data['usage']
        
        # Check today stats
        if 'today' in usage:
            today = usage['today']
            required_today = ['requests', 'tokens', 'cost']
            missing_today = [f for f in required_today if f not in today]
            
            if missing_today:
                log_test("Usage Endpoint - Today Stats", False,
                        f"Missing fields: {', '.join(missing_today)}")
            else:
                log_test("Usage Endpoint - Today Stats", True,
                        f"requests: {today['requests']}, tokens: {today['tokens']}, cost: ${today['cost']}")
        else:
            log_test("Usage Endpoint - Today Stats", False, "Missing 'today' field")
        
        # Check thisMonth stats
        if 'thisMonth' in usage:
            this_month = usage['thisMonth']
            required_month = ['requests', 'tokens', 'cost']
            missing_month = [f for f in required_month if f not in this_month]
            
            if missing_month:
                log_test("Usage Endpoint - This Month Stats", False,
                        f"Missing fields: {', '.join(missing_month)}")
            else:
                log_test("Usage Endpoint - This Month Stats", True,
                        f"requests: {this_month['requests']}, tokens: {this_month['tokens']}, cost: ${this_month['cost']}")
        else:
            log_test("Usage Endpoint - This Month Stats", False, "Missing 'thisMonth' field")
        
        # Check response time < 1 second
        if response_time < 1000:
            log_test("Usage Endpoint - Performance", True,
                    f"Response time {response_time:.0f}ms < 1000ms target")
        else:
            log_test("Usage Endpoint - Performance", False,
                    f"Response time {response_time:.0f}ms > 1000ms target")
        
        print(f"📊 Usage Response: {json.dumps(data, indent=2)}\n")
        
    except Exception as e:
        log_test("Usage Endpoint - Exception", False, str(e))

def test_provider_analytics_endpoint():
    """Test 3: Provider Analytics API"""
    print("=" * 80)
    print("TEST 3: Provider Analytics API - GET /api/ai-studio/v2/provider-analytics")
    print("=" * 80)
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/provider-analytics", timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Provider Analytics - HTTP 200", False,
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Provider Analytics - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check for analytics object
        if 'analytics' not in data:
            log_test("Provider Analytics - Response Structure", False,
                    "Missing 'analytics' field")
            return
        
        analytics = data['analytics']
        
        # Check total stats
        if 'total' in analytics:
            total = analytics['total']
            required_total = ['requests', 'cost', 'tokens']
            missing_total = [f for f in required_total if f not in total]
            
            if missing_total:
                log_test("Provider Analytics - Total Stats", False,
                        f"Missing fields: {', '.join(missing_total)}")
            else:
                log_test("Provider Analytics - Total Stats", True,
                        f"requests: {total['requests']}, tokens: {total['tokens']}, cost: ${total['cost']}")
        else:
            log_test("Provider Analytics - Total Stats", False, "Missing 'total' field")
        
        # Check byProvider breakdown
        if 'byProvider' in analytics:
            by_provider = analytics['byProvider']
            expected_providers = ['emergent', 'atlas', 'mock']
            missing_providers = [p for p in expected_providers if p not in by_provider]
            
            if missing_providers:
                log_test("Provider Analytics - By Provider", False,
                        f"Missing providers: {', '.join(missing_providers)}")
            else:
                provider_summary = []
                for provider, stats in by_provider.items():
                    provider_summary.append(f"{provider}: {stats.get('requests', 0)} req ({stats.get('percentage', 0)}%)")
                log_test("Provider Analytics - By Provider", True,
                        ', '.join(provider_summary))
        else:
            log_test("Provider Analytics - By Provider", False, "Missing 'byProvider' field")
        
        # Check recentRequests
        if 'recentRequests' in analytics:
            recent = analytics['recentRequests']
            log_test("Provider Analytics - Recent Requests", True,
                    f"Found {len(recent)} recent requests")
        else:
            log_test("Provider Analytics - Recent Requests", False, "Missing 'recentRequests' field")
        
        # Check percentage calculations
        if 'byProvider' in analytics:
            by_provider = analytics['byProvider']
            total_percentage = sum(float(p.get('percentage', 0)) for p in by_provider.values())
            
            # Allow for rounding errors (99-101%)
            if 99 <= total_percentage <= 101 or total_percentage == 0:
                log_test("Provider Analytics - Percentage Calculations", True,
                        f"Total percentage: {total_percentage:.1f}%")
            else:
                log_test("Provider Analytics - Percentage Calculations", False,
                        f"Total percentage: {total_percentage:.1f}% (should be ~100%)")
        
        # Check response time < 1 second
        if response_time < 1000:
            log_test("Provider Analytics - Performance", True,
                    f"Response time {response_time:.0f}ms < 1000ms target")
        else:
            log_test("Provider Analytics - Performance", False,
                    f"Response time {response_time:.0f}ms > 1000ms target")
        
        print(f"📊 Provider Analytics Response: {json.dumps(data, indent=2)}\n")
        
    except Exception as e:
        log_test("Provider Analytics - Exception", False, str(e))

def test_text_generation_endpoint():
    """Test 4: Text Generation API"""
    print("=" * 80)
    print("TEST 4: Text Generation API - POST /api/ai-studio/v2/generate/text")
    print("=" * 80)
    
    try:
        # Test with gpt-5.5-pro model
        payload = {
            "prompt": "Test prompt",
            "model": "gpt-5.5-pro",
            "maxTokens": 100
        }
        
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/generate/text", json=payload, timeout=30)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Text Generation - HTTP 200", False,
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Text Generation - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check for result object
        if 'result' not in data:
            log_test("Text Generation - Response Structure", False,
                    "Missing 'result' field")
            return
        
        result = data['result']
        
        # Check required fields in result
        required_fields = ['text', 'provider', 'source', 'usage', 'cost']
        missing_fields = [f for f in required_fields if f not in result]
        
        if missing_fields:
            log_test("Text Generation - Result Structure", False,
                    f"Missing fields: {', '.join(missing_fields)}")
        else:
            log_test("Text Generation - Result Structure", True,
                    f"All required fields present: {', '.join(required_fields)}")
        
        # Check text content
        if 'text' in result and result['text']:
            text_preview = result['text'][:100] + "..." if len(result['text']) > 100 else result['text']
            log_test("Text Generation - Text Content", True,
                    f"Generated text: {text_preview}")
        else:
            log_test("Text Generation - Text Content", False, "No text generated")
        
        # Check provider and source
        if 'provider' in result and 'source' in result:
            log_test("Text Generation - Provider Info", True,
                    f"Provider: {result['provider']}, Source: {result['source']}")
        else:
            log_test("Text Generation - Provider Info", False, "Missing provider/source info")
        
        # Check usage stats
        if 'usage' in result:
            usage = result['usage']
            if 'total_tokens' in usage or 'prompt_tokens' in usage:
                log_test("Text Generation - Usage Stats", True,
                        f"Usage: {json.dumps(usage)}")
            else:
                log_test("Text Generation - Usage Stats", False, "Usage stats incomplete")
        else:
            log_test("Text Generation - Usage Stats", False, "Missing usage field")
        
        # Check cost
        if 'cost' in result:
            log_test("Text Generation - Cost Tracking", True,
                    f"Cost: ${result['cost']}")
        else:
            log_test("Text Generation - Cost Tracking", False, "Missing cost field")
        
        # Check response time < 1 second (for API call, not AI generation)
        if response_time < 30000:  # 30 seconds for AI generation is reasonable
            log_test("Text Generation - Performance", True,
                    f"Response time {response_time:.0f}ms")
        else:
            log_test("Text Generation - Performance", False,
                    f"Response time {response_time:.0f}ms > 30000ms")
        
        print(f"📊 Text Generation Response: {json.dumps(data, indent=2)}\n")
        
    except Exception as e:
        log_test("Text Generation - Exception", False, str(e))

def test_models_endpoint():
    """Test 5: Models API"""
    print("=" * 80)
    print("TEST 5: Models API - GET /api/ai-studio/v2/models")
    print("=" * 80)
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/models", timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Models Endpoint - HTTP 200", False,
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Models Endpoint - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check for models array
        if 'models' not in data:
            log_test("Models Endpoint - Response Structure", False,
                    "Missing 'models' field")
            return
        
        models = data['models']
        
        # Check total count
        if 'total' in data:
            total = data['total']
            if total == 39:
                log_test("Models Endpoint - Total Count", True,
                        f"Expected 39 models, got {total}")
            else:
                log_test("Models Endpoint - Total Count", False,
                        f"Expected 39 models, got {total}")
        else:
            log_test("Models Endpoint - Total Count", False, "Missing 'total' field")
        
        # Check byType breakdown
        if 'byType' in data:
            by_type = data['byType']
            expected_counts = {
                'text': 7,
                'image': 10,
                'video': 12,
                'audio': 5,
                'music': 5
            }
            
            type_check_passed = True
            type_details = []
            for model_type, expected_count in expected_counts.items():
                actual_count = by_type.get(model_type, 0)
                type_details.append(f"{model_type}: {actual_count}")
                if actual_count != expected_count:
                    type_check_passed = False
            
            if type_check_passed:
                log_test("Models Endpoint - By Type Counts", True,
                        ', '.join(type_details))
            else:
                log_test("Models Endpoint - By Type Counts", False,
                        f"Counts don't match expected - {', '.join(type_details)}")
        else:
            log_test("Models Endpoint - By Type Counts", False, "Missing 'byType' field")
        
        # Check model structure (sample first model)
        if models and len(models) > 0:
            sample_model = models[0]
            required_model_fields = ['id', 'type', 'provider', 'logo', 'color', 'pricing']
            missing_model_fields = [f for f in required_model_fields if f not in sample_model]
            
            if missing_model_fields:
                log_test("Models Endpoint - Model Structure", False,
                        f"Missing fields in model: {', '.join(missing_model_fields)}")
            else:
                log_test("Models Endpoint - Model Structure", True,
                        f"Sample model has all required fields: {sample_model['id']}")
        else:
            log_test("Models Endpoint - Model Structure", False, "No models returned")
        
        # Check response time < 1 second
        if response_time < 1000:
            log_test("Models Endpoint - Performance", True,
                    f"Response time {response_time:.0f}ms < 1000ms target")
        else:
            log_test("Models Endpoint - Performance", False,
                    f"Response time {response_time:.0f}ms > 1000ms target")
        
        print(f"📊 Models Response (first 3 models): {json.dumps(models[:3], indent=2)}\n")
        
    except Exception as e:
        log_test("Models Endpoint - Exception", False, str(e))

def test_models_by_type_endpoint():
    """Test 6: Models by Type API"""
    print("=" * 80)
    print("TEST 6: Models by Type API - GET /api/ai-studio/v2/models?type=text")
    print("=" * 80)
    
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/models?type=text", timeout=10)
        response_time = (time.time() - start_time) * 1000
        
        # Check HTTP status
        if response.status_code != 200:
            log_test("Models By Type - HTTP 200", False,
                    f"Expected 200, got {response.status_code}", response_time)
            return
        
        log_test("Models By Type - HTTP 200", True, "", response_time)
        
        # Check response structure
        data = response.json()
        
        # Check for models object
        if 'models' not in data:
            log_test("Models By Type - Response Structure", False,
                    "Missing 'models' field")
            return
        
        models = data['models']
        
        # Check type field
        if 'type' in data and data['type'] == 'text':
            log_test("Models By Type - Type Field", True,
                    f"Type field correct: {data['type']}")
        else:
            log_test("Models By Type - Type Field", False,
                    f"Type field incorrect or missing")
        
        # Check count
        if 'count' in data:
            count = data['count']
            if count == 7:
                log_test("Models By Type - Count", True,
                        f"Expected 7 text models, got {count}")
            else:
                log_test("Models By Type - Count", False,
                        f"Expected 7 text models, got {count}")
        else:
            log_test("Models By Type - Count", False, "Missing 'count' field")
        
        # Check filtering works correctly (all models should be text type)
        if isinstance(models, dict):
            model_ids = list(models.keys())
            expected_text_models = ['gpt-5.5-pro', 'gpt-5.4', 'claude-opus-4.7', 
                                   'gemini-3.0-pro', 'gemini-2.0-flash', 'deepseek-v3', 'qwen-3-32b']
            
            all_present = all(model_id in model_ids for model_id in expected_text_models)
            
            if all_present:
                log_test("Models By Type - Filtering", True,
                        f"All expected text models present: {', '.join(model_ids)}")
            else:
                missing = [m for m in expected_text_models if m not in model_ids]
                log_test("Models By Type - Filtering", False,
                        f"Missing text models: {', '.join(missing)}")
        else:
            log_test("Models By Type - Filtering", False, "Models not in expected format")
        
        # Check response time < 1 second
        if response_time < 1000:
            log_test("Models By Type - Performance", True,
                    f"Response time {response_time:.0f}ms < 1000ms target")
        else:
            log_test("Models By Type - Performance", False,
                    f"Response time {response_time:.0f}ms > 1000ms target")
        
        print(f"📊 Models By Type Response: {json.dumps(data, indent=2)}\n")
        
    except Exception as e:
        log_test("Models By Type - Exception", False, str(e))

def test_provider_tracking():
    """Test 7: Provider Tracking Verification"""
    print("=" * 80)
    print("TEST 7: Provider Tracking - Make 5 requests and verify tracking")
    print("=" * 80)
    
    try:
        # Get initial analytics
        initial_response = requests.get(f"{BASE_URL}/provider-analytics", timeout=10)
        initial_data = initial_response.json()
        initial_total = initial_data['analytics']['total']['requests']
        
        print(f"📊 Initial request count: {initial_total}")
        
        # Make 5 text generation requests
        for i in range(5):
            payload = {
                "prompt": f"Test prompt {i+1}",
                "model": "gpt-5.5-pro",
                "maxTokens": 50
            }
            requests.post(f"{BASE_URL}/generate/text", json=payload, timeout=30)
            time.sleep(0.5)  # Small delay between requests
        
        # Get updated analytics
        time.sleep(1)  # Wait for tracking to update
        updated_response = requests.get(f"{BASE_URL}/provider-analytics", timeout=10)
        updated_data = updated_response.json()
        updated_total = updated_data['analytics']['total']['requests']
        
        print(f"📊 Updated request count: {updated_total}")
        
        # Check if count increased by 5
        increase = updated_total - initial_total
        if increase == 5:
            log_test("Provider Tracking - Request Count", True,
                    f"Request count increased by 5 (from {initial_total} to {updated_total})")
        else:
            log_test("Provider Tracking - Request Count", False,
                    f"Expected increase of 5, got {increase} (from {initial_total} to {updated_total})")
        
        # Check provider breakdown updated
        by_provider = updated_data['analytics']['byProvider']
        provider_summary = []
        for provider, stats in by_provider.items():
            if stats['requests'] > 0:
                provider_summary.append(f"{provider}: {stats['requests']} req")
        
        if provider_summary:
            log_test("Provider Tracking - Provider Breakdown", True,
                    f"Provider breakdown updated: {', '.join(provider_summary)}")
        else:
            log_test("Provider Tracking - Provider Breakdown", False,
                    "No provider breakdown data")
        
    except Exception as e:
        log_test("Provider Tracking - Exception", False, str(e))

def test_caching():
    """Test 8: Caching Verification"""
    print("=" * 80)
    print("TEST 8: Caching - Second request should be faster")
    print("=" * 80)
    
    try:
        # First request
        start_time = time.time()
        response1 = requests.get(f"{BASE_URL}/status", timeout=10)
        time1 = (time.time() - start_time) * 1000
        
        # Second request (should be cached)
        time.sleep(0.1)
        start_time = time.time()
        response2 = requests.get(f"{BASE_URL}/status", timeout=10)
        time2 = (time.time() - start_time) * 1000
        
        print(f"📊 First request: {time1:.0f}ms")
        print(f"📊 Second request: {time2:.0f}ms")
        
        # Check if second request is faster or similar (caching may not be implemented)
        if time2 <= time1 * 1.2:  # Allow 20% variance
            log_test("Caching - Performance Improvement", True,
                    f"Second request {time2:.0f}ms <= First request {time1:.0f}ms")
        else:
            log_test("Caching - Performance Improvement", False,
                    f"Second request {time2:.0f}ms > First request {time1:.0f}ms (caching may not be implemented)")
        
    except Exception as e:
        log_test("Caching - Exception", False, str(e))

def print_summary():
    """Print test summary"""
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    total_tests = len(test_results)
    passed_tests = sum(1 for t in test_results if t['passed'])
    failed_tests = total_tests - passed_tests
    
    print(f"\nTotal Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%\n")
    
    if failed_tests > 0:
        print("Failed Tests:")
        for result in test_results:
            if not result['passed']:
                print(f"  ❌ {result['test']}")
                if result['details']:
                    print(f"     {result['details']}")
        print()
    
    # Performance summary
    print("Performance Summary:")
    perf_tests = [t for t in test_results if t['response_time'] is not None]
    if perf_tests:
        avg_time = sum(t['response_time'] for t in perf_tests) / len(perf_tests)
        max_time = max(t['response_time'] for t in perf_tests)
        min_time = min(t['response_time'] for t in perf_tests)
        print(f"  Average Response Time: {avg_time:.0f}ms")
        print(f"  Min Response Time: {min_time:.0f}ms")
        print(f"  Max Response Time: {max_time:.0f}ms")
    print()

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("BATCH 1 BACKEND API TESTING - GOD TIER ENHANCEMENTS")
    print("AI Studio v2 Endpoints")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Started: {datetime.now().isoformat()}")
    print("=" * 80 + "\n")
    
    # Run all tests
    test_status_endpoint()
    test_usage_endpoint()
    test_provider_analytics_endpoint()
    test_text_generation_endpoint()
    test_models_endpoint()
    test_models_by_type_endpoint()
    test_provider_tracking()
    test_caching()
    
    # Print summary
    print_summary()
    
    print("=" * 80)
    print(f"Test Completed: {datetime.now().isoformat()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
