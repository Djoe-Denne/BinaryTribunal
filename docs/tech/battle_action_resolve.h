#pragma once

#include <stdint.h>

// NOTE: This is high-level pseudocode extracted from IDA.
// Types/field sizes are inferred only for the fields used below.

typedef struct BattleSlotData {
  uint32_t flag_data;
  uint8_t unknown2;
  uint16_t target_info_mask;
  uint16_t current_hp;
  uint16_t max_hp;
  uint8_t status_1;
  uint32_t status_2;
  uint8_t com_file_id;
  uint8_t hit_element;
  uint8_t hit_element_percent;
  uint8_t hit_percent;
  uint8_t attack_enabler;
  uint16_t hit_status_1;
  uint32_t hit_status_2;
  uint8_t last_attacker_attack_type;
  uint8_t spd;
  uint8_t crisis_level;
} BattleSlotData;

typedef struct KernelMagicData {
  uint16_t magic_id;
  uint8_t animation_triggered;
  uint8_t attack_type;
  uint8_t spell_power;
  uint8_t default_target;
  uint8_t attack_flags;
  uint8_t draw_resist;
  uint8_t hit_count;
  uint8_t element;
  uint16_t statuses0;
  uint32_t statuses1;
  uint8_t status_attack_enabler;
} KernelMagicData;

typedef struct KernelItemData {
  uint8_t attack_param;
  uint8_t element;
  uint8_t status_attack_enabler;
  uint16_t status0;
  uint32_t status1;
  uint8_t attack_type;
  uint8_t attack_power;
  uint8_t attack_flags;
  uint8_t unknown2;
} KernelItemData;

typedef struct KernelCommandAbility {
  uint8_t AttackFlags;
  uint8_t AnimationTriggered;
  uint8_t AttackType;
  uint8_t AttackPower;
  uint8_t StatusAttackEnabler;
  uint8_t Element;
  uint16_t status1;
  uint32_t status2;
} KernelCommandAbility;

typedef struct KernelEnemyAttack {
  uint8_t attackFlags;
  uint8_t animationTriggered;
  uint8_t attackType;
  uint8_t attackPower;
  uint8_t attackElement;
  uint8_t statusAttackEnabler;
  uint16_t status0;
  uint32_t status1;
  uint8_t attackParameter;
  uint8_t attackCritBonus;
} KernelEnemyAttack;

typedef struct KernelGFJunctionable {
  uint8_t attackType;
  uint8_t gfPower;
  uint8_t attackFlags;
  uint8_t unknown2;
  uint8_t element;
  uint8_t statusAttackEnabler;
  uint16_t statuses0;
  uint32_t statuses1;
  uint8_t levelMod;
  uint8_t powerMod;
} KernelGFJunctionable;

// Global context (from IDA)
extern BattleSlotData BATTLE_SLOT_DATA[];
extern KernelMagicData K_MAGIC[];
extern KernelItemData K_ITEM[];
extern KernelCommandAbility K_BATTLE_COMMAND_ABILITY[];
extern KernelEnemyAttack K_ENEMY_ATTACK[];
extern KernelGFJunctionable K_GF_JUNCTIONABLE[];

extern uint8_t COMMAND_TYPE_ID;
extern uint16_t CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
extern uint8_t ATTACKER_SLOT_ID;
extern uint8_t EQUAL_GAME_OVER_RELATED;
extern uint8_t SHOT_INDEX;

extern uint8_t HIT_TYPE_TARGET_ANIMATION_TO_PLAY;
extern uint8_t HIT_TYPE_2;
extern uint8_t ATTACK_FLAG;
extern uint8_t HIT_ELEMENT;
extern uint8_t HIT_ELEMENT_PERCENT;
extern uint8_t HIT_ATTACK_ENABLER;
extern uint16_t HIT_STATUS_1;
extern uint32_t HIT_STATUS_2;
extern uint8_t HIT_ATTACK_HITPERCENT;
extern uint8_t RELATED_TO_CRIT_BONUS;
extern uint16_t DAMAGE_DEAL;

// Helpers (names from IDA)
int Damage_ComputeRawDeltaFromAttackType(int attack_type,
                                        int attacker_slot_id,
                                        int target_slot_id,
                                        int attack_power);

int Battle_ApplyDamageOrHeal(int target_slot_id,
                             int damage,
                             uint8_t *hit_type_2,
                             uint8_t *hit_flags,
                             int attacker_slot_id,
                             uint8_t *hit_anim,
                             uint16_t *out_status1,
                             uint32_t *out_status2,
                             int is_drain);

int getMugObjectIdAndQuantity(int target_slot_id,
                              int *out_item_id,
                              int *out_qty,
                              uint8_t attacker_spd);

// High-level pseudocode entrypoint.
char BattleAction_ResolveAndApplyDamage(int target_slot_id);
