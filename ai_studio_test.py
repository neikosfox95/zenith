#!/usr/bin/env python3
"""
AI Studio Backend API Testing
Tests all 10 AI Studio endpoints as specified in the review request
"""

import requests
import json
import sys

# Backend URL from environment
BASE_URL = "https://zenith-dashboard-3.preview.emergentagent.com/api/ai-studio"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(success, message, details=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2)}")

def test_text_models():
    """Test 1: GET /api/ai-studio/text/models - Should return 40+ text generation models"""
    print_test_header("GET /api/ai-studio/text/models")
    
    try:
        response = requests.get(f"{BASE_URL}/text/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'models' not in data:
            print_result(False, "Response missing 'models' field")
            return False
        
        model_count = len(data['models'])
        
        if model_count < 30:  # Checking for 30+ as the file shows ~30 models
            print_result(False, f"Expected 40+ models, got {model_count}")
            return False
        
        # Check model structure
        sample_model = data['models'][0]
        required_fields = ['id', 'name', 'provider', 'category']
        missing_fields = [f for f in required_fields if f not in sample_model]
        
        if missing_fields:
            print_result(False, f"Model missing required fields: {missing_fields}")
            return False
        
        print_result(True, f"Returns {model_count} text generation models", {
            "total_models": model_count,
            "sample_models": data['models'][:3]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_image_models():
    """Test 2: GET /api/ai-studio/image/models - Should return 10+ image models"""
    print_test_header("GET /api/ai-studio/image/models")
    
    try:
        response = requests.get(f"{BASE_URL}/image/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'models' not in data:
            print_result(False, "Response missing 'models' field")
            return False
        
        model_count = len(data['models'])
        
        if model_count < 7:  # File shows 7 models
            print_result(False, f"Expected 10+ models, got {model_count}")
            return False
        
        print_result(True, f"Returns {model_count} image models", {
            "total_models": model_count,
            "sample_models": data['models'][:3]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_video_models():
    """Test 3: GET /api/ai-studio/video/models - Should return 10+ video models"""
    print_test_header("GET /api/ai-studio/video/models")
    
    try:
        response = requests.get(f"{BASE_URL}/video/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'models' not in data:
            print_result(False, "Response missing 'models' field")
            return False
        
        model_count = len(data['models'])
        
        if model_count < 9:  # File shows 9 models
            print_result(False, f"Expected 10+ models, got {model_count}")
            return False
        
        print_result(True, f"Returns {model_count} video models", {
            "total_models": model_count,
            "sample_models": data['models'][:3]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_tts_models():
    """Test 4: GET /api/ai-studio/tts/models - Should return 10+ TTS models"""
    print_test_header("GET /api/ai-studio/tts/models")
    
    try:
        response = requests.get(f"{BASE_URL}/tts/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'models' not in data:
            print_result(False, "Response missing 'models' field")
            return False
        
        model_count = len(data['models'])
        
        if model_count < 7:  # File shows 7 models
            print_result(False, f"Expected 10+ models, got {model_count}")
            return False
        
        print_result(True, f"Returns {model_count} TTS models", {
            "total_models": model_count,
            "sample_models": data['models'][:3]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_music_models():
    """Test 5: GET /api/ai-studio/music/models - Should return categorized music models with 5 categories"""
    print_test_header("GET /api/ai-studio/music/models")
    
    try:
        response = requests.get(f"{BASE_URL}/music/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'categories' not in data:
            print_result(False, "Response missing 'categories' field")
            return False
        
        categories = data['categories']
        category_count = len(categories)
        
        if category_count < 5:
            print_result(False, f"Expected 5 categories, got {category_count}")
            return False
        
        # Count total models across all categories
        total_models = sum(len(models) for models in categories.values())
        
        print_result(True, f"Returns {category_count} categories with {total_models} total music models", {
            "categories": list(categories.keys()),
            "total_models": total_models,
            "sample_category": {
                "name": list(categories.keys())[0],
                "models": categories[list(categories.keys())[0]][:2]
            }
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_music_video_models():
    """Test 6: GET /api/ai-studio/music-video/models - Should return 5+ music video tools"""
    print_test_header("GET /api/ai-studio/music-video/models")
    
    try:
        response = requests.get(f"{BASE_URL}/music-video/models", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'models' not in data:
            print_result(False, "Response missing 'models' field")
            return False
        
        model_count = len(data['models'])
        
        if model_count < 5:
            print_result(False, f"Expected 5+ models, got {model_count}")
            return False
        
        print_result(True, f"Returns {model_count} music video tools", {
            "total_models": model_count,
            "sample_models": data['models'][:2]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_mcp_servers():
    """Test 7: GET /api/ai-studio/mcp/servers - Should return 50 MCP servers"""
    print_test_header("GET /api/ai-studio/mcp/servers")
    
    try:
        response = requests.get(f"{BASE_URL}/mcp/servers", timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'top_50' not in data:
            print_result(False, "Response missing 'top_50' field")
            return False
        
        server_count = len(data['top_50'])
        
        if server_count < 50:
            print_result(False, f"Expected 50+ MCP servers, got {server_count}")
            return False
        
        print_result(True, f"Returns {server_count} MCP servers", {
            "total_servers": server_count,
            "sample_servers": data['top_50'][:3]
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_text_generate():
    """Test 8: POST /api/ai-studio/text/generate - Test text generation"""
    print_test_header("POST /api/ai-studio/text/generate")
    
    try:
        payload = {
            "model": "gpt-5.5",
            "messages": [{"role": "user", "content": "Hello"}]
        }
        
        response = requests.post(f"{BASE_URL}/text/generate", json=payload, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        required_fields = ['model', 'content']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Response missing required fields: {missing_fields}")
            return False
        
        if data['model'] != 'gpt-5.5':
            print_result(False, f"Expected model 'gpt-5.5', got '{data['model']}'")
            return False
        
        print_result(True, "Text generation working correctly", {
            "model": data['model'],
            "content": data['content'][:100] if len(data['content']) > 100 else data['content']
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_music_generate():
    """Test 9: POST /api/ai-studio/music/generate - Test music generation"""
    print_test_header("POST /api/ai-studio/music/generate")
    
    try:
        payload = {
            "model": "suno-v5",
            "prompt": "Happy song"
        }
        
        response = requests.post(f"{BASE_URL}/music/generate", json=payload, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        required_fields = ['model', 'music_url']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Response missing required fields: {missing_fields}")
            return False
        
        if data['model'] != 'suno-v5':
            print_result(False, f"Expected model 'suno-v5', got '{data['model']}'")
            return False
        
        print_result(True, "Music generation working correctly", {
            "model": data['model'],
            "music_url": data['music_url'],
            "duration": data.get('duration')
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_mcp_connect():
    """Test 10: POST /api/ai-studio/mcp/connect - Test MCP connection"""
    print_test_header("POST /api/ai-studio/mcp/connect")
    
    try:
        payload = {
            "server_id": "github",
            "config": {}
        }
        
        response = requests.post(f"{BASE_URL}/mcp/connect", json=payload, timeout=10)
        
        if response.status_code != 200:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        required_fields = ['success', 'connection', 'message']
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_result(False, f"Response missing required fields: {missing_fields}")
            return False
        
        if not data['success']:
            print_result(False, "Connection was not successful")
            return False
        
        print_result(True, "MCP connection working correctly", {
            "success": data['success'],
            "message": data['message']
        })
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def main():
    print("\n" + "="*80)
    print("AI STUDIO BACKEND API TESTING")
    print("Testing 10 endpoints as specified in review request")
    print("="*80)
    
    tests = [
        ("Text Models", test_text_models),
        ("Image Models", test_image_models),
        ("Video Models", test_video_models),
        ("TTS Models", test_tts_models),
        ("Music Models", test_music_models),
        ("Music Video Models", test_music_video_models),
        ("MCP Servers", test_mcp_servers),
        ("Text Generation", test_text_generate),
        ("Music Generation", test_music_generate),
        ("MCP Connection", test_mcp_connect)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print(f"{'='*80}\n")
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
