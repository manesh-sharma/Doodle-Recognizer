import pytest
from app.model_service import model_service

def test_combine_classes_loaded():
    """Verify curated_v4_combine_classes.json was loaded correctly"""
    assert len(model_service.normal_groups) == 29, f"Expected 29 normal groups, got {len(model_service.normal_groups)}"
    assert len(model_service.dynamic_support_groups) == 1, "Expected 1 dynamic support group"
    assert len(model_service.removed_classes) == 131, f"Expected 131 removed classes, got {len(model_service.removed_classes)}"
    assert "bird" in model_service.removed_classes
    assert "barn" in model_service.removed_classes
    assert "tornado" in model_service.removed_classes
    assert "hurricane" not in model_service.removed_classes

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

def test_bird_dynamic_support_owl_top():
    """
    Test Bird special case when Owl is top specific bird:
    owl=0.45, parrot=0.20, bird=0.15:
    - owl confidence = 0.45 + 0.15 = 0.60 (60.0%)
    - parrot remains 0.20 (20.0%)
    - bird must NOT be in predictions
    - Target confidence for 'owl' = 60.0%
    - Target confidence for 'parrot' = 20.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["owl"] = 0.45
    raw_probs["parrot"] = 0.20
    raw_probs["bird"] = 0.15
    raw_probs["cat"] = 0.10
    raw_probs["apple"] = 0.10

    preds, owl_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="owl")
    _, parrot_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="parrot")

    pred_names = [p["class_name"].lower() for p in preds]
    assert "bird" not in pred_names, "'bird' is removed and must NOT be in predictions!"
    assert preds[0]["class_name"].lower() == "owl"
    assert preds[0]["confidence"] == 60.0
    assert preds[1]["class_name"].lower() == "parrot"
    assert preds[1]["confidence"] == 20.0
    assert owl_conf == 60.0
    assert parrot_conf == 20.0

def test_bird_dynamic_support_parrot_top():
    """
    Test Bird special case when Parrot is top specific bird:
    parrot=0.40, owl=0.25, bird=0.20:
    - parrot confidence = 0.40 + 0.20 = 0.60 (60.0%)
    - owl remains 0.25 (25.0%)
    - bird must NOT be in predictions
    - Target confidence for 'parrot' = 60.0%
    - Target confidence for 'owl' = 25.0%
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["parrot"] = 0.40
    raw_probs["owl"] = 0.25
    raw_probs["bird"] = 0.20
    raw_probs["cat"] = 0.10
    raw_probs["apple"] = 0.05

    preds, parrot_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="parrot")
    _, owl_conf = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="owl")

    pred_names = [p["class_name"].lower() for p in preds]
    assert "bird" not in pred_names, "'bird' is removed and must NOT be in predictions!"
    assert preds[0]["class_name"].lower() == "parrot"
    assert preds[0]["confidence"] == 60.0
    assert preds[1]["class_name"].lower() == "owl"
    assert preds[1]["confidence"] == 25.0
    assert parrot_conf == 60.0
    assert owl_conf == 25.0

def test_removed_classes_never_in_predictions():
    """
    Ensure all removed classes are strictly omitted from prediction results.
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    # Set high probabilities for removed classes
    raw_probs["teddy-bear"] = 0.50
    raw_probs["panda"] = 0.30
    raw_probs["apple"] = 0.10
    raw_probs["banana"] = 0.10

    preds, _ = model_service._aggregate_and_format_predictions(raw_probs)
    pred_names = [p["class_name"].lower() for p in preds]
    assert "teddy-bear" not in pred_names
    assert "panda" not in pred_names
    assert preds[0]["class_name"].lower() == "apple"

def test_ball_group_combination():
    """
    Test Ball group (baseball + basketball + soccer ball -> ball)
    """
    raw_probs = {cname: 0.0 for cname in model_service.name_to_class}
    raw_probs["baseball"] = 0.30
    raw_probs["basketball"] = 0.25
    raw_probs["soccer ball"] = 0.20
    raw_probs["apple"] = 0.15
    raw_probs["banana"] = 0.10

    preds, target_conf_baseball = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="baseball")
    _, target_conf_ball = model_service._aggregate_and_format_predictions(raw_probs, target_class_name="ball")

    pred_names = [p["class_name"].lower() for p in preds]
    assert "baseball" not in pred_names
    assert "basketball" not in pred_names
    assert "soccer ball" not in pred_names
    assert "ball" in pred_names
    assert preds[0]["class_name"].lower() == "ball"
    assert preds[0]["confidence"] == 75.0
    assert target_conf_baseball == 75.0
    assert target_conf_ball == 75.0

if __name__ == "__main__":
    test_combine_classes_loaded()
    print("[PASS] test_combine_classes_loaded")
    test_house_and_barn_combination()
    print("[PASS] test_house_and_barn_combination")
    test_bird_dynamic_support_owl_top()
    print("[PASS] test_bird_dynamic_support_owl_top")
    test_bird_dynamic_support_parrot_top()
    print("[PASS] test_bird_dynamic_support_parrot_top")
    test_removed_classes_never_in_predictions()
    print("[PASS] test_removed_classes_never_in_predictions")
    test_ball_group_combination()
    print("[PASS] test_ball_group_combination")
    print("\nALL COMBINE LOGIC TESTS PASSED SUCCESSFULLY!")
