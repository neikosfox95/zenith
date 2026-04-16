#!/usr/bin/env python3
"""
PHASE 6 BACKEND API TESTING
Testing Advanced Media Intelligence APIs
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
        "email": "phase6test@example.com",
        "username": "phase6tester",
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
                "email": "phase6test@example.com",
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
    """Run all Phase 6 API tests"""
    print("🚀 PHASE 6 BACKEND API TESTING")
    print("=" * 50)
    
    # First, authenticate to get a valid token
    print("\n🔐 AUTHENTICATION SETUP")
    print("-" * 25)
    if not get_auth_token():
        print("❌ Failed to authenticate. Cannot proceed with tests.")
        return False
    
    tests_passed = 0
    tests_total = 0
    
    # ============= IMAGE GENERATION TESTS =============
    print("\n📸 IMAGE GENERATION TESTS")
    print("-" * 30)
    
    # Test 1: Get image models
    tests_total += 1
    if test_endpoint("GET", "/media/image/models", description="Get available image models"):
        tests_passed += 1
    
    # Test 2: Generate image with nano-banana-2
    tests_total += 1
    image_data = {
        "prompt": "A futuristic city at sunset with flying cars",
        "model": "nano-banana-2",
        "size": "1024x1024",
        "num_images": 1,
        "quality": "standard"
    }
    if test_endpoint("POST", "/media/image/generate", image_data, "Generate image with nano-banana-2"):
        tests_passed += 1
    
    # Test 3: Generate image with gpt-image-1.5
    tests_total += 1
    image_data_gpt = {
        "prompt": "A serene mountain landscape with a crystal clear lake",
        "model": "gpt-image-1.5",
        "size": "1024x1024",
        "quality": "high"
    }
    if test_endpoint("POST", "/media/image/generate", image_data_gpt, "Generate image with gpt-image-1.5"):
        tests_passed += 1
    
    # Test 4: Generate image with grok-imagine-speed
    tests_total += 1
    image_data_grok = {
        "prompt": "A cyberpunk robot in neon-lit alley",
        "model": "grok-imagine-speed",
        "size": "1024x1024"
    }
    if test_endpoint("POST", "/media/image/generate", image_data_grok, "Generate image with grok-imagine-speed"):
        tests_passed += 1
    
    # ============= AUDIO/VOICE PROCESSING TESTS =============
    print("\n🎤 AUDIO/VOICE PROCESSING TESTS")
    print("-" * 35)
    
    # Test 5: Get audio models
    tests_total += 1
    if test_endpoint("GET", "/media/audio/models", description="Get available audio models"):
        tests_passed += 1
    
    # Test 6: Audio transcription with Whisper
    tests_total += 1
    transcribe_data = {
        "audio_file": "test_audio.mp3",
        "model": "whisper",
        "language": "en"
    }
    if test_endpoint("POST", "/media/audio/transcribe", transcribe_data, "Transcribe audio with Whisper"):
        tests_passed += 1
    
    # Test 7: Audio transcription with Gemini Audio
    tests_total += 1
    transcribe_data_gemini = {
        "audio_file": "test_audio.wav",
        "model": "gemini-audio",
        "language": "en"
    }
    if test_endpoint("POST", "/media/audio/transcribe", transcribe_data_gemini, "Transcribe audio with Gemini Audio"):
        tests_passed += 1
    
    # Test 8: Voice cloning with Fish Audio Instant
    tests_total += 1
    clone_data = {
        "audio_sample": "voice_sample.mp3",
        "text": "Hello, this is a test of voice cloning technology",
        "model": "fish-audio-instant",
        "emotion": "neutral"
    }
    if test_endpoint("POST", "/media/audio/clone-voice", clone_data, "Clone voice with Fish Audio Instant"):
        tests_passed += 1
    
    # Test 9: Voice cloning with VoiceBox 2.0
    tests_total += 1
    clone_data_voicebox = {
        "audio_sample": "voice_sample.wav",
        "text": "Testing multilingual voice cloning capabilities",
        "model": "voicebox-2.0",
        "emotion": "happy"
    }
    if test_endpoint("POST", "/media/audio/clone-voice", clone_data_voicebox, "Clone voice with VoiceBox 2.0"):
        tests_passed += 1
    
    # ============= VIDEO GENERATION TESTS =============
    print("\n🎬 VIDEO GENERATION TESTS")
    print("-" * 30)
    
    # Test 10: Get video models
    tests_total += 1
    if test_endpoint("GET", "/media/video/models", description="Get available video models"):
        tests_passed += 1
    
    # Test 11: Generate video with Veo 3.1 Fast
    tests_total += 1
    video_data = {
        "prompt": "A drone flying over snow-capped mountains at golden hour",
        "model": "veo-3.1-fast",
        "duration": 8,
        "resolution": "720p",
        "aspect_ratio": "16:9"
    }
    if test_endpoint("POST", "/media/video/generate", video_data, "Generate video with Veo 3.1 Fast"):
        tests_passed += 1
    
    # Test 12: Generate video with Sora 2 Pro
    tests_total += 1
    video_data_sora = {
        "prompt": "A time-lapse of a bustling city street with people walking",
        "model": "sora-2-pro",
        "duration": 30,
        "resolution": "1080p"
    }
    if test_endpoint("POST", "/media/video/generate", video_data_sora, "Generate video with Sora 2 Pro"):
        tests_passed += 1
    
    # Test 13: Generate video with Grok Video Quality
    tests_total += 1
    video_data_grok = {
        "prompt": "A magical forest with glowing fireflies at night",
        "model": "grok-imagine-video-quality",
        "duration": 10,
        "resolution": "720p"
    }
    if test_endpoint("POST", "/media/video/generate", video_data_grok, "Generate video with Grok Video Quality"):
        tests_passed += 1
    
    # Test 14: Check video status
    tests_total += 1
    if test_endpoint("GET", "/media/video/status/test-job-123", description="Check video generation status"):
        tests_passed += 1
    
    # ============= ERROR HANDLING TESTS =============
    print("\n⚠️  ERROR HANDLING TESTS")
    print("-" * 25)
    
    # Test 15: Image generation without prompt
    tests_total += 1
    invalid_image_data = {
        "model": "nano-banana-2",
        "size": "1024x1024"
    }
    print(f"\n🧪 Testing: Image generation without prompt (should fail)")
    print(f"   POST /media/image/generate")
    try:
        response = requests.post(f"{API_BASE}/media/image/generate", headers=HEADERS, json=invalid_image_data, timeout=30)
        if response.status_code == 400:
            print(f"   ✅ SUCCESS - Correctly rejected (400)")
            tests_passed += 1
        else:
            print(f"   ❌ FAILED - Expected 400, got {response.status_code}")
    except Exception as e:
        print(f"   ❌ FAILED - Error: {str(e)}")
    
    # Test 16: Video generation without prompt
    tests_total += 1
    invalid_video_data = {
        "model": "veo-3.1-fast",
        "duration": 8
    }
    print(f"\n🧪 Testing: Video generation without prompt (should fail)")
    print(f"   POST /media/video/generate")
    try:
        response = requests.post(f"{API_BASE}/media/video/generate", headers=HEADERS, json=invalid_video_data, timeout=30)
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
    
    # Test 17: Access without token
    tests_total += 1
    print(f"\n🧪 Testing: Access without authentication token (should fail)")
    print(f"   GET /media/image/models")
    try:
        response = requests.get(f"{API_BASE}/media/image/models", timeout=30)
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
        print("\n🎉 ALL TESTS PASSED! Phase 6 APIs are working correctly.")
        return True
    else:
        print(f"\n⚠️  {tests_total - tests_passed} tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)