"""
Detection Utility Functions.
Provides spatial location computation, bounding box formatting, and distance estimation helpers.
"""

from typing import Tuple


def calculate_spatial_position(xmin: float, xmax: float, image_width: float) -> str:
    """
    Computes qualitative spatial position of object relative to user's field of view.
    """
    center_x = (xmin + xmax) / 2.0
    third = image_width / 3.0

    if center_x < third:
        return "far left"
    elif center_x < third * 2:
        return "center ahead"
    else:
        return "far right"


def estimate_distance_by_bbox_area(bbox_area: float, image_area: float) -> str:
    """
    Roughly estimates object proximity based on relative bounding box area.
    """
    ratio = bbox_area / image_area
    if ratio > 0.3:
        return "very close (within 1 meter)"
    elif ratio > 0.1:
        return "moderate distance (1 to 3 meters)"
    else:
        return "far away (over 3 meters)"
