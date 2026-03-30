import os
import sys
import requests

staging_url = os.environ.get("STAGING_URL")
if not staging_url:
    print("STAGING_URL not set")
    sys.exit(1)

staging_url = staging_url.rstrip("/")

print(f"Testing against Staging API Gateway: {staging_url}")

success = True

# Test 1: Root check GET /
print("\n[Test 1] Executing GET /")
try:
    r1 = requests.get(f"{staging_url}/")
    print(f"Status: {r1.status_code}")
    if r1.status_code == 200:
        print(f"Response: {r1.json()}")
    else:
        success = False
        print(f"FAILED: {r1.text}")
except Exception as e:
    success = False
    print(f"Connection Error: {e}")

# Test 2: Search POST /search
print("\n[Test 2] Executing POST /search")
try:
    r2 = requests.post(f"{staging_url}/search", json={"query": "spiritual growth"})
    print(f"Status: {r2.status_code}")
    if r2.status_code == 200:
        results = r2.json()
        print(f"Found {len(results)} results")
        if len(results) > 0:
            blog_id = results[0]["_id"]
            # Test 3: Get specific article
            print(f"\n[Test 3] Executing GET /blog/{blog_id}")
            r3 = requests.get(f"{staging_url}/blog/{blog_id}")
            print(f"Status: {r3.status_code}")
            if r3.status_code != 200:
                print(f"FAILED: {r3.text}")
                success = False
    else:
        success = False
        print(f"FAILED: {r2.text}")
except Exception as e:
    success = False
    print(f"Connection Error: {e}")

print("\n--- Smoke Test Completed ---")
if not success:
    sys.exit(1)
