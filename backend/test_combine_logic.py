import pytest
from app.model_service import model_service

def test_combine_classes_loaded():
    """Verify curated_v4_combine_classes.json was loaded correctly"""
    assert len(model_service.normal_groups) >= 40, f"Expected >= 40 normal groups, got {len(model_service.normal_groups)}"
    assert len(model_service.dynamic_support_groups) == 1, "Expected 1 dynamic support group"
    assert len(model_service.removed_classes) >= 135, f"Expected >= 135 removed classes, got {len(model_service.removed_classes)}"
    assert "bird" in model_service.removed_classes
    assert "barn" in model_service.removed_classes
    assert "tornado" in model_service.removed_classes
    assert "hurricane" not in model_service.removed_classes
    assert "zigzag" in model_service.removed_classes

def test_house_and_barn_combination():
    """
    Test House and Barn:
    Barn is marked removed, house is easy.
    When barn=0.40 and house=0.35:
    - House confidence = 0.35 + 0.40 = 0.75 (75.0%)
    - Barn must NOT be in predictions
    - Target confidence for 'house' = 75.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["barn"] = 0.40
    raw_probs["house"] = 0.35
    raw_probs["tree"] = 0.15
    raw_probs["apple"] = 0.10

    preds, target_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="house")

    pred_names = [p["class_name"].lower() for p in preds]
    assert "barn" not in pred_names, "Removed class 'barn' must NOT be in predictions!"
    assert "house" in pred_names, "'house' should be in predictions!"
    assert preds[0]["class_name"].lower() == "house"
    assert preds[0]["confidence"] == 75.0
    assert target_conf == 75.0

def test_guitar_violin_cello_combination():
    """
    Test Guitar combination:
    Guitar is medium, violin & cello are removed.
    When violin=0.30, cello=0.25, guitar=0.20:
    - Guitar confidence = 0.20 + 0.30 + 0.25 = 0.75 (75.0%)
    - Violin & Cello must NOT be in predictions
    - Target confidence for 'guitar' = 75.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["guitar"] = 0.20
    raw_probs["violin"] = 0.30
    raw_probs["cello"] = 0.25
    raw_probs["apple"] = 0.15
    raw_probs["tree"] = 0.10

    preds, target_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="guitar")
    pred_names = [p["class_name"].lower() for p in preds]
    assert "violin" not in pred_names
    assert "cello" not in pred_names
    assert preds[0]["class_name"].lower() == "guitar"
    assert preds[0]["confidence"] == 75.0
    assert target_conf == 75.0

def test_bird_dynamic_support_owl_top():
    """
    Test Bird special case when Owl is top specific bird:
    owl=0.45, swan=0.20, bird=0.15:
    - owl confidence = 0.45 + 0.15 = 0.60 (60.0%)
    - swan remains 0.20 (20.0%)
    - bird must NOT be in predictions
    - Target confidence for 'owl' = 60.0%
    - Target confidence for 'swan' = 20.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["owl"] = 0.45
    raw_probs["swan"] = 0.20
    raw_probs["bird"] = 0.15
    raw_probs["cat"] = 0.10
    raw_probs["apple"] = 0.10

    preds, owl_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="owl")
    _, swan_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="swan")

    pred_names = [p["class_name"].lower() for p in preds]
    assert "bird" not in pred_names, "'bird' is removed and must NOT be in predictions!"
    assert preds[0]["class_name"].lower() == "owl"
    assert preds[0]["confidence"] == 60.0
    assert preds[1]["class_name"].lower() == "swan"
    assert preds[1]["confidence"] == 20.0
    assert owl_conf == 60.0
    assert swan_conf == 20.0

def test_removed_classes_never_in_predictions():
    """
    Ensure all removed classes are strictly omitted from prediction results.
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    # Set high probabilities for removed classes
    raw_probs["matches"] = 0.50
    raw_probs["zigzag"] = 0.30
    raw_probs["apple"] = 0.10
    raw_probs["bat"] = 0.10

    preds, _ = model_service._aggregate_and_format_predictions(raw_probs)
    pred_names = [p["class_name"].lower() for p in preds]
    assert "matches" not in pred_names
    assert "zigzag" not in pred_names
    assert preds[0]["class_name"].lower() == "apple"

def test_hurricane_and_tornado_combination():
    """
    Test Hurricane and Tornado:
    Tornado is marked removed, hurricane is easy.
    When tornado=0.45 and hurricane=0.30:
    - Hurricane confidence = 0.30 + 0.45 = 0.75 (75.0%)
    - Tornado must NOT be in predictions
    - Target confidence for 'hurricane' = 75.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["tornado"] = 0.45
    raw_probs["hurricane"] = 0.30
    raw_probs["apple"] = 0.15
    raw_probs["cat"] = 0.10

    preds, target_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="hurricane")
    pred_names = [p["class_name"].lower() for p in preds]

    assert "hurricane" in pred_names
    assert "tornado" not in pred_names
    assert preds[0]["class_name"].lower() == "hurricane"
    assert target_conf == 75.0

def test_balls_are_distinct():
    """
    Test Ball classes (baseball, basketball, soccer ball are distinct active classes)
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["baseball"] = 0.60
    raw_probs["basketball"] = 0.25
    raw_probs["soccer ball"] = 0.10
    raw_probs["apple"] = 0.05

    preds, target_conf_baseball = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="baseball")
    pred_names = [p["class_name"].lower() for p in preds]
    assert "baseball" in pred_names
    assert "basketball" in pred_names
    assert preds[0]["class_name"].lower() == "baseball"
    assert preds[0]["confidence"] == 60.0
    assert target_conf_baseball == 60.0

if __name__ == "__main__":
    test_combine_classes_loaded()
    print("[PASS] test_combine_classes_loaded")
    test_house_and_barn_combination()
    print("[PASS] test_house_and_barn_combination")
    test_guitar_violin_cello_combination()
    print("[PASS] test_guitar_violin_cello_combination")
    test_bird_dynamic_support_owl_top()
    print("[PASS] test_bird_dynamic_support_owl_top")
    test_removed_classes_never_in_predictions()
    print("[PASS] test_removed_classes_never_in_predictions")
    test_hurricane_and_tornado_combination()
    print("[PASS] test_hurricane_and_tornado_combination")
    test_balls_are_distinct()
    print("[PASS] test_balls_are_distinct")
    print("\nALL COMBINE LOGIC TESTS PASSED SUCCESSFULLY!")
