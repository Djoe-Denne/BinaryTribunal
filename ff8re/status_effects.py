"""FF8 status bitfield decoding helpers."""

from __future__ import annotations

STATUS_EFFECTS: list[tuple[int, str]] = [
    (0, "Sleep"),
    (1, "Haste"),
    (2, "Slow"),
    (3, "Stop"),
    (4, "Regen"),
    (5, "Protect"),
    (6, "Shell"),
    (7, "Reflect"),
    (8, "Aura"),
    (9, "Curse"),
    (10, "Doom"),
    (11, "Invincible"),
    (12, "Petrifying"),
    (13, "Float"),
    (14, "Confusion"),
    (15, "Drain"),
    (16, "Eject"),
    (17, "Double"),
    (18, "Triple"),
    (19, "Unknown 19"),
    (20, "Unknown 20"),
    (21, "Defend"),
    (22, "Charged"),
    (23, "Back Attack"),
    (24, "Vit 0"),
    (25, "Angel Wing"),
    (26, "Unknown 26"),
    (27, "Unknown 27"),
    (28, "Unknown 28"),
    (29, "Unknown 29"),
    (30, "Has Magic"),
    (31, "Summon GF"),
    (32, "Death"),
    (33, "Poison"),
    (34, "Petrify"),
    (35, "Darkness"),
    (36, "Silence"),
    (37, "Berserk"),
    (38, "Zombie"),
    (39, "Unknown 39"),
]


def decode_status_effects(statuses1: int, statuses0: int) -> list[str]:
    """Convert FF8 status bitfields into active status names."""
    combined_mask = (statuses0 & 0xFFFF) << 32 | (statuses1 & 0xFFFFFFFF)
    return [
        name
        for bit_index, name in STATUS_EFFECTS
        if combined_mask & (1 << bit_index)
    ]


def decode_status_bytes(data: bytes) -> list[str]:
    """Decode status effects from a 6-byte payload (little endian)."""
    if len(data) != 6:
        raise ValueError("status payload must be exactly 6 bytes long")
    statuses1 = int.from_bytes(data[0:4], byteorder="little", signed=False)
    statuses0 = int.from_bytes(data[4:6], byteorder="little", signed=False)
    return decode_status_effects(statuses1, statuses0)
