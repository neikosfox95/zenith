#!/usr/bin/env python3
"""
PHASE 7 BACKEND API TESTING
Testing Code AI Intelligence APIs
"""

import requests
import json
import sys
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://zenith-dashboard-3.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

# Test authentication token - will be obtained by registering a test user
AUTH_TOKEN = None
HEADERS = {
    "Content-Type": "application/json"
}

def get_auth_token():
    """Register a test user and get authentication token"""
    global AUTH_TOKEN, HEADERS
    
    if AUTH_TOKEN:
        return AUTH_TOKEN
    
    # Register test user
    register_data = {
        "email": "phase7test@example.com",
        "username": "phase7tester",
        "password": "testpassword123"
    }
    
    try:
        response = requests.post(f"{API_BASE}/auth/register", json=register_data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            AUTH_TOKEN = result.get('token')
            HEADERS["Authorization"] = f"Bearer {AUTH_TOKEN}"
            print("✅ Test user registered and authenticated")
            return AUTH_TOKEN
        elif response.status_code == 400:
            # User might already exist, try login
            login_data = {
                "email": "phase7test@example.com",
                "password": "testpassword123"
            }
            response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                AUTH_TOKEN = result.get('token')
                HEADERS["Authorization"] = f"Bearer {AUTH_TOKEN}"
                print("✅ Test user logged in and authenticated")
                return AUTH_TOKEN
    except Exception as e:
        print(f"❌ Failed to authenticate: {str(e)}")
    
    return None

def test_endpoint(method, endpoint, data=None, description=""):
    """Test an API endpoint"""
    url = f"{API_BASE}{endpoint}"
    print(f"\n🧪 Testing: {description}")
    print(f"   {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=HEADERS, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=HEADERS, json=data, timeout=30)
        else:
            print(f"   ❌ Unsupported method: {method}")
            return False
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   ✅ SUCCESS")
                if isinstance(result, dict):
                    # Show key fields for verification
                    if 'models' in result:
                        print(f"   📊 Found {len(result['models'])} models")
                    elif 'code' in result:
                        print(f"   💻 Generated code: {result['code'][:50]}...")
                    elif 'job_id' in result:
                        print(f"   🎬 Job ID: {result['job_id']}")
                    elif 'images' in result:
                        print(f"   🖼️  Generated {len(result['images'])} images")
                    elif 'text' in result:
                        print(f"   📝 Transcription: {result['text'][:50]}...")
                    elif 'cloned_voice_id' in result:
                        print(f"   🎤 Voice ID: {result['cloned_voice_id']}")
                return True
            except json.JSONDecodeError:
                print(f"   ✅ SUCCESS (non-JSON response)")
                return True
        else:
            print(f"   ❌ FAILED - Status {response.status_code}")
            try:
                error = response.json()
                print(f"   Error: {error.get('error', 'Unknown error')}")
            except:
                print(f"   Error: {response.text[:100]}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ FAILED - Connection error: {str(e)}")
        return False
    except Exception as e:
        print(f"   ❌ FAILED - Unexpected error: {str(e)}")
        return False

def main():
    """Run all Phase 7 Code AI API tests"""
    print("🚀 PHASE 7 CODE AI BACKEND API TESTING")
    print("=" * 50)
    
    # First, authenticate to get a valid token
    print("\n🔐 AUTHENTICATION SETUP")
    print("-" * 25)
    if not get_auth_token():
        print("❌ Failed to authenticate. Cannot proceed with tests.")
        return False
    
    tests_passed = 0
    tests_total = 0
    
    # ============= CODE AI MODELS TESTS =============
    print("\n🤖 CODE AI MODELS TESTS")
    print("-" * 30)
    
    # Test 1: Get coding models
    tests_total += 1
    if test_endpoint("GET", "/code/models", description="Get available coding models"):
        tests_passed += 1
    
    # ============= CODE GENERATION TESTS =============
    print("\n💻 CODE GENERATION TESTS")
    print("-" * 30)
    
    # Test 2: Generate Python code with codex-gpt-5.2
    tests_total += 1
    code_data = {
        "prompt": "Write a Python function to calculate fibonacci numbers",
        "model": "codex-gpt-5.2",
        "language": "python",
        "task": "generate"
    }
    if test_endpoint("POST", "/code/generate", code_data, "Generate Python code with codex-gpt-5.2"):
        tests_passed += 1
    
    # Test 3: Generate JavaScript code with claude-4.6-opus-code
    tests_total += 1
    code_data_js = {
        "prompt": "Create a JavaScript function to sort an array of objects by a property",
        "model": "claude-4.6-opus-code",
        "language": "javascript",
        "task": "generate"
    }
    if test_endpoint("POST", "/code/generate", code_data_js, "Generate JavaScript code with claude-4.6-opus-code"):
        tests_passed += 1
    
    # Test 4: Generate Java code with deepseek-coder-v3
    tests_total += 1
    code_data_java = {
        "prompt": "Write a Java class for a binary search tree",
        "model": "deepseek-coder-v3",
        "language": "java",
        "task": "generate"
    }
    if test_endpoint("POST", "/code/generate", code_data_java, "Generate Java code with deepseek-coder-v3"):
        tests_passed += 1
    
    # ============= CODE DEBUGGING TESTS =============
    print("\n🐛 CODE DEBUGGING TESTS")
    print("-" * 30)
    
    # Test 5: Fix Python code
    tests_total += 1
    fix_data = {
        "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2",
        "error_message": "SyntaxError: unexpected EOF while parsing",
        "model": "claude-4.6-opus-code",
        "language": "python"
    }
    if test_endpoint("POST", "/code/fix", fix_data, "Fix Python code with syntax error"):
        tests_passed += 1
    
    # Test 6: Fix JavaScript code
    tests_total += 1
    fix_data_js = {
        "code": "function sortArray(arr, prop) {\n    return arr.sort((a, b) => a[prop] - b[prop]\n}",
        "error_message": "SyntaxError: missing ) after argument list",
        "model": "codex-gpt-5.2",
        "language": "javascript"
    }
    if test_endpoint("POST", "/code/fix", fix_data_js, "Fix JavaScript code with syntax error"):
        tests_passed += 1
    
    # ============= CODE EXPLANATION TESTS =============
    print("\n📖 CODE EXPLANATION TESTS")
    print("-" * 30)
    
    # Test 7: Explain Python code
    tests_total += 1
    explain_data = {
        "code": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
        "model": "claude-4.6-sonnet-code",
        "language": "python"
    }
    if test_endpoint("POST", "/code/explain", explain_data, "Explain Python quicksort algorithm"):
        tests_passed += 1
    
    # Test 8: Explain JavaScript code
    tests_total += 1
    explain_data_js = {
        "code": "const debounce = (func, delay) => {\n    let timeoutId;\n    return (...args) => {\n        clearTimeout(timeoutId);\n        timeoutId = setTimeout(() => func.apply(this, args), delay);\n    };\n};",
        "model": "deepseek-coder-v3",
        "language": "javascript"
    }
    if test_endpoint("POST", "/code/explain", explain_data_js, "Explain JavaScript debounce function"):
        tests_passed += 1
    
    # ============= CODE OPTIMIZATION TESTS =============
    print("\n⚡ CODE OPTIMIZATION TESTS")
    print("-" * 30)
    
    # Test 9: Optimize Python code
    tests_total += 1
    optimize_data = {
        "code": "def find_duplicates(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i+1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates",
        "model": "deepseek-coder-v3",
        "language": "python"
    }
    if test_endpoint("POST", "/code/optimize", optimize_data, "Optimize Python duplicate finder"):
        tests_passed += 1
    
    # Test 10: Optimize JavaScript code
    tests_total += 1
    optimize_data_js = {
        "code": "function isPrime(n) {\n    if (n <= 1) return false;\n    for (let i = 2; i < n; i++) {\n        if (n % i === 0) return false;\n    }\n    return true;\n}",
        "model": "codex-gpt-5.2",
        "language": "javascript"
    }
    if test_endpoint("POST", "/code/optimize", optimize_data_js, "Optimize JavaScript prime checker"):
        tests_passed += 1
    
    # ============= CODE REVIEW TESTS =============
    print("\n🔍 CODE REVIEW TESTS")
    print("-" * 30)
    
    # Test 11: Review Python code
    tests_total += 1
    review_data = {
        "code": "import os\ndef read_file(filename):\n    file = open(filename, 'r')\n    content = file.read()\n    return content\n\ndef process_data(data):\n    result = eval(data)\n    return result",
        "model": "claude-4.6-opus-code",
        "language": "python"
    }
    if test_endpoint("POST", "/code/review", review_data, "Review Python code for security issues"):
        tests_passed += 1
    
    # Test 12: Review JavaScript code
    tests_total += 1
    review_data_js = {
        "code": "function getUserData(userId) {\n    const query = 'SELECT * FROM users WHERE id = ' + userId;\n    return database.query(query);\n}\n\nfunction setUserPassword(password) {\n    localStorage.setItem('password', password);\n}",
        "model": "deepseek-coder-v3",
        "language": "javascript"
    }
    if test_endpoint("POST", "/code/review", review_data_js, "Review JavaScript code for security vulnerabilities"):
        tests_passed += 1
    
    # ============= ERROR HANDLING TESTS =============
    print("\n⚠️  ERROR HANDLING TESTS")
    print("-" * 25)
    
    # Test 13: Code generation without prompt
    tests_total += 1
    invalid_code_data = {
        "model": "codex-gpt-5.2",
        "language": "python",
        "task": "generate"
    }
    print(f"\n🧪 Testing: Code generation without prompt (should fail)")
    print(f"   POST /code/generate")
    try:
        response = requests.post(f"{API_BASE}/code/generate", headers=HEADERS, json=invalid_code_data, timeout=30)
        if response.status_code == 400:
            print(f"   ✅ SUCCESS - Correctly rejected (400)")
            tests_passed += 1
        else:
            print(f"   ❌ FAILED - Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ FAILED - Error: {str(e)}")
    
    # Test 14: Code fix without code
    tests_total += 1
    invalid_fix_data = {
        "error_message": "Some error",
        "model": "claude-4.6-opus-code",
        "language": "python"
    }
    print(f"\n🧪 Testing: Code fix without code (should fail)")
    print(f"   POST /code/fix")
    try:
        response = requests.post(f"{API_BASE}/code/fix", headers=HEADERS, json=invalid_fix_data, timeout=30)
        if response.status_code == 400:
            print(f"   ✅ SUCCESS - Correctly rejected (400)")
            tests_passed += 1
        else:
            print(f"   ❌ FAILED - Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ FAILED - Error: {str(e)}")
    
    # ============= AUTHENTICATION TESTS =============
    print("\n🔐 AUTHENTICATION TESTS")
    print("-" * 25)
    
    # Test 15: Access without token
    tests_total += 1
    print(f"\n🧪 Testing: Access without authentication token (should fail)")
    print(f"   GET /code/models")
    try:
        response = requests.get(f"{API_BASE}/code/models", timeout=30)
        if response.status_code == 401:
            print(f"   ✅ SUCCESS - Correctly rejected (401)")
            tests_passed += 1
        else:
            print(f"   ❌ FAILED - Expected 401, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ FAILED - Error: {str(e)}")
    
    # ============= RESULTS SUMMARY =============
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {tests_total}")
    print(f"Passed: {tests_passed}")
    print(f"Failed: {tests_total - tests_passed}")
    print(f"Success Rate: {(tests_passed/tests_total)*100:.1f}%")
    
    if tests_passed == tests_total:
        print("\n🎉 ALL TESTS PASSED! Phase 7 Code AI APIs are working correctly.")
        return True
    else:
        print(f"\n⚠️  {tests_total - tests_passed} tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)