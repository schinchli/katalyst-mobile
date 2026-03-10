#!/usr/bin/env python3
import sys, subprocess, urllib.request, json, qrcode

if len(sys.argv) > 1:
    url = sys.argv[1]
else:
    raw = urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=2).read()
    tunnels = json.loads(raw).get("tunnels", [])
    https = next((t["public_url"] for t in tunnels if t["public_url"].startswith("https")), None)
    url = https.replace("https://", "exp://")

qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
qr.add_data(url)
qr.make(fit=True)
qr.print_ascii(invert=True)
print(f"\n  {url}")
