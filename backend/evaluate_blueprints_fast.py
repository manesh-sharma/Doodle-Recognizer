import re
import os
import sys
import json
import cv2
import numpy as np
import keras

sys.path.append(os.path.dirname(__file__))
from app.model_service import model_service
import build_blueprints

model = keras.models.load_model('model.keras')

def safe_render_paths(paths, stroke=14):
    img = np.full((400, 400), 255, dtype=np.uint8)
    for d_str in paths:
        matches = re.finditer(r'([a-zA-Z])([^a-zA-Z]*)', d_str)
        curr = (0, 0)
        start = (0, 0)
        for m in matches:
            cmd = m.group(1).upper()
            nums = [float(x) for x in re.findall(r'[-+]?[0-9]*\.?[0-9]+', m.group(2))]
            if cmd == 'M' and len(nums) >= 2:
                curr = (int(nums[0]), int(nums[1]))
                start = curr
            elif cmd == 'L' and len(nums) >= 2:
                for k in range(0, len(nums)-1, 2):
                    nxt = (int(nums[k]), int(nums[k+1]))
                    cv2.line(img, curr, nxt, 0, stroke)
                    curr = nxt
            elif cmd == 'C' and len(nums) >= 6:
                for k in range(0, len(nums)-5, 6):
                    p0, p1, p2, p3 = curr, (nums[k], nums[k+1]), (nums[k+2], nums[k+3]), (nums[k+4], nums[k+5])
                    pts = [((1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t**2*p2[0] + t**3*p3[0],
                            (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t**2*p2[1] + t**3*p3[1]) for t in np.linspace(0,1,16)]
                    for i in range(len(pts)-1):
                        cv2.line(img, (int(pts[i][0]), int(pts[i][1])), (int(pts[i+1][0]), int(pts[i+1][1])), 0, stroke)
                    curr = (int(p3[0]), int(p3[1]))
            elif cmd == 'Q' and len(nums) >= 4:
                for k in range(0, len(nums)-3, 4):
                    p0, p1, p2 = curr, (nums[k], nums[k+1]), (nums[k+2], nums[k+3])
                    pts = [((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t**2*p2[0],
                            (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t**2*p2[1]) for t in np.linspace(0,1,16)]
                    for i in range(len(pts)-1):
                        cv2.line(img, (int(pts[i][0]), int(pts[i][1])), (int(pts[i+1][0]), int(pts[i+1][1])), 0, stroke)
                    curr = (int(p2[0]), int(p2[1]))
            elif cmd == 'A' and len(nums) >= 7:
                for k in range(0, len(nums)-6, 7):
                    rx, ry, end_x, end_y = nums[k], nums[k+1], nums[k+5], nums[k+6]
                    mid_x = (curr[0] + end_x) / 2.0
                    mid_y = (curr[1] + end_y) / 2.0
                    cv2.ellipse(img, (int(mid_x), int(mid_y)), (int(max(1, rx)), int(max(1, ry))), 0, 0, 360, 0, stroke)
                    curr = (int(end_x), int(end_y))
            elif cmd == 'Z':
                cv2.line(img, curr, start, 0, stroke)
                curr = start
    return img

def prep_cv(img):
    diff = 255 - img
    _, binary = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    pts = cv2.findNonZero(binary)
    if pts is None or len(pts) < 10:
        return np.zeros((28, 28, 1), dtype=np.float32)
    x, y, w, h = cv2.boundingRect(pts)
    cropped = binary[y:y+h, x:x+w]
    max_dim = max(w, h)
    pad = int(max_dim * 0.12)
    padded_dim = max_dim + 2 * pad
    sq = np.zeros((padded_dim, padded_dim), dtype=np.uint8)
    sq[pad + (max_dim-h)//2 : pad + (max_dim-h)//2 + h, pad + (max_dim-w)//2 : pad + (max_dim-w)//2 + w] = cropped
    res28 = cv2.resize(sq, (28, 28), interpolation=cv2.INTER_AREA)
    norm = res28.astype(np.float32) / 255.0
    return norm.reshape(28, 28, 1)

classes = build_blueprints.ordered_classes
tensors = []
for item in classes:
    cname = item['class_name'].lower().strip()
    bp = build_blueprints.BP.get(cname)
    paths = bp['paths'] if bp else []
    img = safe_render_paths(paths)
    tensors.append(prep_cv(img))

batch = np.array(tensors, dtype=np.float32)
all_preds = model(batch, training=False).numpy()

results = []
for i, item in enumerate(classes):
    cname = item['class_name']
    raw_probs = {model_service.id_to_class[idx]['class_name'].lower(): float(p) for idx, p in enumerate(all_preds[i]) if idx in model_service.id_to_class}
    preds, target_conf = model_service._aggregate_and_format_predictions(raw_probs, cname)
    top1 = preds[0]['class_name'] if preds else 'none'
    is_top1 = (top1.lower() == cname.lower())
    results.append({
        'class': cname,
        'label': item['label'],
        'top1': top1,
        'target_conf': target_conf,
        'is_top1': is_top1
    })

top1s = [r for r in results if r['is_top1']]
print(f'Total active classes tested: {len(results)}')
print(f'Top-1 Exact Matches: {len(top1s)} / {len(results)} ({len(top1s)/len(results)*100:.1f}%)')
print(f'Above 90% Confidence: {len([r for r in results if r["target_conf"] >= 90.0])}')
print(f'Above 70% Confidence: {len([r for r in results if r["target_conf"] >= 70.0])}')

non_top1 = [r for r in results if not r['is_top1']]
print(f'\nNon-Top-1 classes ({len(non_top1)}):')
for r in non_top1[:30]:
    print(f'  {r["class"]} -> predicted "{r["top1"]}" (conf: {r["target_conf"]}%)')

with open('blueprint_test_summary.json', 'w') as f:
    json.dump(results, f, indent=2)
