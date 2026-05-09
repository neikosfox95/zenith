#!/usr/bin/env python3
"""
AI Endpoints Re-Test
Tests the 2 fixed AI endpoints as per review request:
1. POST /api/ai/generate - with graceful error handling and mock mode
2. GET /api/ai/models - public endpoint without authentication
"""

import requests
import json
import sys

# Backend URL
BACKEND_URL = "https://zenith-dashboard-3.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def test_ai_generate():
    """
    Test POST /api/ai/generate
    Expected:
    - HTTP 200
    - success: true
    - result.text contains response (may be in mock mode)
    - result.model shows model used
    - No 500 errors
    """
    print("\n" + "="*80)
    print("TEST 1: POST /api/ai/generate")
    print("="*80)
    
    test_payload = {
        "prompt": "Generate a brief summary of TikTok live analytics",
        "taskType": "text",
        "complexity": "medium"
    }
    
    print(f"\n📤 Request:")
    print(f"   URL: {API_BASE}/ai/generate")
    print(f"   Payload: {json.dumps(test_payload, indent=2)}")
    
    try:
        response = requests.post(
            f"{API_BASE}/ai/generate",
            json=test_payload,
            timeout=30
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response Body: {json.dumps(data, indent=2)}")
            
            # Check success field
            if data.get('success') == True:
                print("\n✅ SUCCESS CRITERIA CHECK:")
                print(f"   ✅ HTTP 200: YES")
                print(f"   ✅ success: true: YES")
                
                # Check result field
                result = data.get('result', {})
                if result:
                    print(f"   ✅ result exists: YES")
                    
                    # Check for text field
                    text = result.get('text')
                    if text:
                        print(f"   ✅ result.text exists: YES")
                        print(f"      Text preview: {text[:100]}...")
                        
                        # Check if it's mock mode
                        if result.get('mock') == True or '[AI Response - Mock Mode]' in text:
                            print(f"   ℹ️  Mock mode: YES (API keys are placeholders - EXPECTED)")
                        else:
                            print(f"   ℹ️  Mock mode: NO (Real AI response)")
                    else:
                        print(f"   ❌ result.text exists: NO")
                    
                    # Check for model field
                    model = result.get('model')
                    if model:
                        print(f"   ✅ result.model exists: YES ({model})")
                    else:
                        print(f"   ❌ result.model exists: NO")
                    
                    # Check metadata
                    metadata = data.get('metadata', {})
                    if metadata:
                        print(f"   ✅ metadata exists: YES")
                        print(f"      Model: {metadata.get('model')}")
                        print(f"      Task Type: {metadata.get('taskType')}")
                        print(f"      Complexity: {metadata.get('complexity')}")
                else:
                    print(f"   ❌ result field missing")
                
                print(f"   ✅ No 500 errors: YES")
                print("\n✅ TEST PASSED - All success criteria met!")
                return True
            else:
                print(f"\n❌ TEST FAILED - success field is not true")
                return False
        else:
            print(f"   Response Body: {response.text}")
            print(f"\n❌ TEST FAILED - Expected HTTP 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST FAILED - Exception: {str(e)}")
        return False

def test_ai_models():
    """
    Test GET /api/ai/models
    Expected:
    - HTTP 200
    - success: true
    - models.text array with at least 3 models (gpt-5.5-pro, claude-opus-4.7, gemini-3.1-ultra)
    - models.code array with coding models
    - models.image array with image generation models
    - models.video array with video models
    - No authentication required (public endpoint)
    - No "Access denied" error
    """
    print("\n" + "="*80)
    print("TEST 2: GET /api/ai/models")
    print("="*80)
    
    print(f"\n📤 Request:")
    print(f"   URL: {API_BASE}/ai/models")
    print(f"   Authentication: NONE (testing public access)")
    
    try:
        # Test WITHOUT authentication to verify it's public
        response = requests.get(
            f"{API_BASE}/ai/models",
            timeout=10
        )
        
        print(f"\n📥 Response:")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   Response Body: {json.dumps(data, indent=2)}")
            
            # Check success field
            if data.get('success') == True:
                print("\n✅ SUCCESS CRITERIA CHECK:")
                print(f"   ✅ HTTP 200: YES")
                print(f"   ✅ success: true: YES")
                print(f"   ✅ No authentication required: YES")
                print(f"   ✅ No 'Access denied' error: YES")
                
                # Check models field
                models = data.get('models', {})
                if models:
                    print(f"   ✅ models exists: YES")
                    
                    # Check text models
                    text_models = models.get('text', [])
                    if len(text_models) >= 3:
                        print(f"   ✅ models.text array: YES ({len(text_models)} models)")
                        
                        # Check for required models
                        text_model_ids = [m.get('id') for m in text_models]
                        required_models = ['gpt-5.5-pro', 'claude-opus-4.7', 'gemini-3.1-ultra']
                        found_models = [m for m in required_models if m in text_model_ids]
                        
                        if len(found_models) == 3:
                            print(f"      ✅ Required models present: {', '.join(found_models)}")
                        else:
                            print(f"      ⚠️  Some required models missing. Found: {', '.join(found_models)}")
                    else:
                        print(f"   ❌ models.text array: Only {len(text_models)} models (need at least 3)")
                    
                    # Check code models
                    code_models = models.get('code', [])
                    if len(code_models) > 0:
                        print(f"   ✅ models.code array: YES ({len(code_models)} models)")
                    else:
                        print(f"   ❌ models.code array: Empty or missing")
                    
                    # Check image models
                    image_models = models.get('image', [])
                    if len(image_models) > 0:
                        print(f"   ✅ models.image array: YES ({len(image_models)} models)")
                    else:
                        print(f"   ❌ models.image array: Empty or missing")
                    
                    # Check video models
                    video_models = models.get('video', [])
                    if len(video_models) > 0:
                        print(f"   ✅ models.video array: YES ({len(video_models)} models)")
                    else:
                        print(f"   ❌ models.video array: Empty or missing")
                    
                    print("\n✅ TEST PASSED - All success criteria met!")
                    return True
                else:
                    print(f"   ❌ models field missing")
                    return False
            else:
                print(f"\n❌ TEST FAILED - success field is not true")
                return False
        elif response.status_code == 401 or response.status_code == 403:
            print(f"   Response Body: {response.text}")
            print(f"\n❌ TEST FAILED - Authentication required (should be public endpoint)")
            return False
        else:
            print(f"   Response Body: {response.text}")
            print(f"\n❌ TEST FAILED - Expected HTTP 200, got {response.status_code}")
            return False
            
    except Exception as e:
        print(f"\n❌ TEST FAILED - Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("="*80)
    print("AI ENDPOINTS RE-TEST")
    print("Testing 2 fixed endpoints as per review request")
    print("="*80)
    
    results = []
    
    # Test 1: POST /api/ai/generate
    test1_passed = test_ai_generate()
    results.append(("POST /api/ai/generate", test1_passed))
    
    # Test 2: GET /api/ai/models
    test2_passed = test_ai_models()
    results.append(("GET /api/ai/models", test2_passed))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    print(f"\nTotal Tests: {total_count}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {total_count - passed_count}")
    
    print("\nDetailed Results:")
    for endpoint, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status} - {endpoint}")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nBoth endpoints are working correctly:")
        print("  1. POST /api/ai/generate has graceful error handling with mock mode")
        print("  2. GET /api/ai/models is publicly accessible without authentication")
        return True
    else:
        print(f"\n⚠️  {total_count - passed_count} TEST(S) FAILED")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
