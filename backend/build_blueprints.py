"""
Generator script to build the complete, high-fidelity SVG blueprints dataset for all 208 active classes.
Each active class receives a dedicated, recognizable, and authentic outline and tips.
Merges EASY_BLUEPRINTS (80), MEDIUM_BLUEPRINTS (96), and HARD_BLUEPRINTS (32).
"""
import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
sys.path.insert(0, BASE_DIR)

from blueprints_easy import EASY_BLUEPRINTS
from blueprints_medium import MEDIUM_BLUEPRINTS
from blueprints_hard import HARD_BLUEPRINTS

curated_path = os.path.join(ROOT_DIR, 'curated_classes_v4.json')
with open(curated_path, 'r', encoding='utf-8') as f:
    curated = json.load(f)

active_classes = [c for c in curated['classes'] if c['label'] != 'removed']
easy_classes = [c for c in active_classes if c['label'] == 'easy']
med_classes = [c for c in active_classes if c['label'] == 'medium']
hard_classes = [c for c in active_classes if c['label'] == 'hard']
raw_ordered = easy_classes + med_classes + hard_classes

ordered_classes = [
    {
        "id": c["id"],
        "name": c["class_name"],
        "class_name": c["class_name"],
        "difficulty": c["label"],
        "label": c["label"]
    }
    for c in raw_ordered
]

print(f"Loaded {len(ordered_classes)} active classes: Easy={len(easy_classes)}, Med={len(med_classes)}, Hard={len(hard_classes)}")

# Merge all curated blueprints
BP = {}

# Merge Easy (80)
for k, v in EASY_BLUEPRINTS.items():
    BP[k.lower().strip()] = v

# Merge Medium (96)
for k, v in MEDIUM_BLUEPRINTS.items():
    BP[k.lower().strip()] = v

# Merge Hard (32)
for k, v in HARD_BLUEPRINTS.items():
    BP[k.lower().strip()] = v

print(f"Total curated dedicated blueprints: {len(BP)}")

# Verify all active classes are present in BP
missing = []
for c in ordered_classes:
    cname = c["class_name"].lower().strip()
    if cname not in BP:
        missing.append(c["class_name"])

if missing:
    print(f"WARNING: {len(missing)} active classes missing dedicated blueprints: {missing}")
else:
    print("SUCCESS: 100% of all active classes have dedicated, authentic blueprints!")

# Generate JS code
js_code = """// Comprehensive Doodle Blueprints & Learning Lessons Dataset
// Contains all 208 active curated classes sorted Easy -> Medium -> Hard
// Every single active class provides authentic vector outline blueprints and tips.

export const ACTIVE_CLASSES_ORDERED = """ + json.dumps(ordered_classes, indent=2) + """;

export const CURATED_BLUEPRINTS = """ + json.dumps(BP, indent=2) + """;

export function getBlueprintForClass(className) {
  const key = className ? className.toLowerCase().trim() : '';
  if (CURATED_BLUEPRINTS[key]) {
    return CURATED_BLUEPRINTS[key];
  }

  // Find class display info
  const item = ACTIVE_CLASSES_ORDERED.find((c) => c.name?.toLowerCase() === key || c.class_name?.toLowerCase() === key);
  const diff = item ? (item.difficulty || item.label) : 'medium';
  const display = item ? (item.name || item.class_name) : className;

  return {
    name: display,
    difficulty: diff,
    tips: `Trace the outline clearly for ${display}. Keep strokes steady and continuous.`,
    paths: []
  };
}

export function getAllLearningLessons() {
  return ACTIVE_CLASSES_ORDERED.map((item, idx) => {
    const cname = item.class_name || item.name;
    const bp = getBlueprintForClass(cname);
    return {
      level: idx + 1,
      id: cname,
      className: cname,
      displayName: bp.name || cname,
      difficulty: item.label || item.difficulty || 'medium',
      tips: bp.tips,
      paths: bp.paths || []
    };
  });
}
"""

target_path = os.path.join(ROOT_DIR, 'frontend', 'src', 'data', 'doodleBlueprints.js')
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(js_code)

print(f"Successfully generated {target_path} ({os.path.getsize(target_path)} bytes)")
