import urllib.request
from seed import PHOTO_IDS, U

for pid in PHOTO_IDS:
    url = U.format(pid)
    try:
        code = urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=10).status
    except Exception as e:
        code = f"FAIL {e}"
    print(code, pid)