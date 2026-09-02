import numpy as np

MAX_LEN = 300


def strokes_to_sequence(strokes):

    sequence = []

    for stroke in strokes:

        if len(stroke) == 0:
            continue

        previous_x = stroke[0]["x"]
        previous_y = stroke[0]["y"]

        for point in stroke:

            x = point["x"]
            y = point["y"]

            dx = x - previous_x
            dy = y - previous_y

            sequence.append([
                dx,
                dy,
                1.0
            ])

            previous_x = x
            previous_y = y

        # Pen lifted
        sequence.append([
            0.0,
            0.0,
            0.0
        ])

    return np.asarray(
        sequence,
        dtype=np.float32
    )


def normalize_sequence(sequence):

    if len(sequence) == 0:
        return sequence

    scale = np.max(
        np.abs(sequence[:, :2])
    )

    if scale > 0:
        sequence[:, :2] /= scale

    return sequence


def prepare_input(strokes):

    sequence = strokes_to_sequence(
        strokes
    )

    sequence = normalize_sequence(
        sequence
    )

    sequence = sequence[:MAX_LEN]

    padded = np.zeros(
        (MAX_LEN, 3),
        dtype=np.float32
    )

    length = min(
        len(sequence),
        MAX_LEN
    )

    padded[:length] = sequence[:length]

    return np.expand_dims(
        padded,
        axis=0
    )