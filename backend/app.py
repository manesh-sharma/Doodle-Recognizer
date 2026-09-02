import os
import json

import numpy as np
import tensorflow as tf

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.preprocessing import prepare_input


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "model",
    "doodle_rnn_10class_finetuned.keras"
)

CLASS_PATH = os.path.join(
    BASE_DIR,
    "model",
    "class_names_10.json"
)


# --------------------------------------------------
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="Doodle Recognizer API"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# --------------------------------------------------
# Load model
# --------------------------------------------------

print("Loading model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)


with open(
    CLASS_PATH,
    "r",
    encoding="utf-8"
) as file:

    class_names = json.load(file)


print("Model loaded.")

print(
    "Classes:",
    class_names
)


# --------------------------------------------------
# Request models
# --------------------------------------------------

class Point(BaseModel):

    x: float
    y: float


class PredictionRequest(BaseModel):

    strokes: list[list[Point]]


# --------------------------------------------------
# Routes
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message":
        "Doodle Recognizer API is running"
    }


@app.post("/predict")
def predict(
    request: PredictionRequest
):

    # Convert Pydantic objects
    # into normal dictionaries

    strokes = [

        [
            {
                "x": point.x,
                "y": point.y
            }

            for point in stroke
        ]

        for stroke in request.strokes

    ]


    # Preprocess drawing

    input_data = prepare_input(
        strokes
    )


    # Model prediction

    prediction = model.predict(
        input_data,
        verbose=0
    )[0]


    # Sort predictions
    top_indices = np.argsort(
        prediction
    )[::-1]


    # Best prediction

    predicted_index = int(
        top_indices[0]
    )


    predicted_class = (
        class_names[predicted_index]
    )


    confidence = float(
        prediction[predicted_index]
    )


    # Top 3 predictions

    top_predictions = []

    for index in top_indices[:3]:

        top_predictions.append({

            "class":
                class_names[index],

            "confidence":
                float(prediction[index])

        })


    return {

        "class":
            predicted_class,

        "confidence":
            confidence,

        "top_predictions":
            top_predictions

    }