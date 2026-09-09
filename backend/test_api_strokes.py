import requests
import io
import base64
from PIL import Image, ImageDraw

def test_apple_api(full, stroke):
    img = Image.new("L", (400, 400), 255)
    d = ImageDraw.Draw(img)
    r = int(400 * 0.38) if full else int(400 * 0.18)
    cx, cy = 200, 200
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=0, width=stroke)
    d.line((cx, cy - r, cx + int(r * 0.2), cy - r - int(r * 0.4)), fill=0, width=stroke)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    
    r = requests.post("http://127.0.0.1:8000/api/predict", json={"image": b64, "target_class": "apple"})
    data = r.json()
    top = data["predictions"][0]
    cname = top["class_name"]
    conf = top["confidence"]
    target_conf = data.get("target_confidence", 0)
    print(f"Full={str(full):5s}, Stroke={stroke:2d} -> Top: {cname} ({conf}%), Target Apple: {target_conf}%")

if __name__ == "__main__":
    print("Testing live API predictions across brush sizes and drawing extents:")
    test_apple_api(True, 10)
    test_apple_api(True, 18)
    test_apple_api(True, 26)
    test_apple_api(False, 10)
    test_apple_api(False, 18)
