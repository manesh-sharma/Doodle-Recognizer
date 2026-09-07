import numpy as np

MAX_LEN = 300


def resample_strokes(strokes, max_points):
    """
    Reduce the number of points while preserving
    the complete drawing and all stroke boundaries.
    """

    valid_strokes = [
        stroke for stroke in strokes
        if len(stroke) > 0
    ]

    if not valid_strokes:
        return []

    # Every stroke needs at least one point.
    # One additional timestep is reserved for
    # the pen-lift marker after each stroke.
    lift_count = len(valid_strokes)

    point_budget = max_points - lift_count

    if point_budget <= 0:
        return valid_strokes

    total_points = sum(
        len(stroke)
        for stroke in valid_strokes
    )

    # No resampling required.
    if total_points <= point_budget:
        return valid_strokes

    # Allocate points to each stroke proportionally
    # to its original size.
    allocations = []

    for stroke in valid_strokes:

        proportion = (
            len(stroke) / total_points
        )

        allocation = max(
            2,
            int(round(
                proportion * point_budget
            ))
        )

        allocations.append(allocation)

    # Make sure the total allocation does not
    # exceed the available budget.
    while sum(allocations) > point_budget:

        largest_index = int(
            np.argmax(allocations)
        )

        if allocations[largest_index] <= 2:
            break

        allocations[largest_index] -= 1

    # If there is remaining space, distribute it.
    while sum(allocations) < point_budget:

        largest_stroke = max(
            range(len(valid_strokes)),
            key=lambda i: len(valid_strokes[i])
        )

        allocations[largest_stroke] += 1

    # Resample each stroke.
    resampled = []

    for stroke, target_count in zip(
        valid_strokes,
        allocations
    ):

        if len(stroke) <= target_count:

            resampled.append(stroke)

            continue

        indices = np.linspace(
            0,
            len(stroke) - 1,
            target_count
        ).astype(int)

        indices = np.unique(indices)

        resampled.append([
            stroke[index]
            for index in indices
        ])

    return resampled


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

    # First reduce excessive points while
    # preserving the complete drawing.
    strokes = resample_strokes(
        strokes,
        MAX_LEN
    )

    # Convert strokes to dx/dy/pen-state.
    sequence = strokes_to_sequence(
        strokes
    )

    # Keep the existing normalization
    # used by the trained model.
    sequence = normalize_sequence(
        sequence
    )

    # Safety check.
    sequence = sequence[:MAX_LEN]

    # Pad to exactly 300 timesteps.
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