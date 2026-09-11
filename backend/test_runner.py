import json
import os
import re
import cv2
import numpy as np
import keras
import sys

sys.path.append(os.path.dirname(__file__))
from app.model_service import model_service

model = keras.models.load_model('model.keras')

with open('curated_classes_v4.json', 'r') as f:
    curated = json.load(f)

active = [c for c in curated['classes'] if c['label'] != 'removed']
active_names = {c['class_name'].lower().strip() for c in active}

print(f"Total active classes: {len(active)}")
