#pragma once

#include <stdint.h>

// NOTE: This is high-level pseudocode extracted from IDA.
// Types/field sizes are inferred only for the fields used below.

// Matches IDA `FF8BattleSlotData_s` (sizeof 0xD0).
// Only a subset of fields are used by battle action resolve, but the offsets matter.
typedef struct FF8BattleSlotData_s {
  /* 0x00 */ void *monster_info_section; // ff8_battle_monster_info**
  /* 0x04 */ void *monster_ai_section;   // DWORD**
  /* 0x08 */ uint32_t status_2;
  /* 0x0C */ uint32_t status_2_copy;
  /* 0x10 */ uint32_t max_atb;
  /* 0x14 */ uint32_t cur_atb;
  /* 0x18 */ uint32_t current_hp;
  /* 0x1C */ uint32_t max_hp;
  /* 0x20 */ uint32_t hit_status_2;
  /* 0x24 */ uint8_t set_zero[0x20];
  /* 0x44 */ int16_t elem_def[8];
  /* 0x54 */ uint8_t timer[0x20]; // FF8BattleTimer_e[16]
  /* 0x74 */ uint16_t coordinate_x;
  /* 0x76 */ uint16_t coordinate_y;
  /* 0x78 */ uint16_t coordinate_z;
  /* 0x7A */ uint8_t _pad_7A[2];
  /* 0x7C */ uint16_t flag_data;
  /* 0x7E */ uint16_t immunity_flag_data;
  /* 0x80 */ uint16_t status_1;
  /* 0x82 */ uint16_t status_1_copy;
  /* 0x84 */ uint16_t target_info_mask;
  /* 0x86 */ uint16_t hit_status_1;
  /* 0x88 */ uint8_t last_attacker_slot_id;
  /* 0x89 */ uint8_t last_attacker_attack_type;
  /* 0x8A */ uint8_t number_turn;
  /* 0x8B */ uint8_t last_attacker_command_type;
  /* 0x8C */ uint8_t last_attacker_attack_element;
  /* 0x8D */ uint8_t last_attacker_is;
  /* 0x8E */ uint8_t bool_related_to_damage_deal;
  /* 0x8F */ uint8_t last_attacker_action_or_gf_used;
  /* 0x90 */ uint8_t mental_res[0x28]; // byte-addressed in init code
  /* 0xB8 */ uint8_t magic_to_blow_away;
  /* 0xB9 */ uint8_t saved_hp_flag; // renamed from padding; semantics TBD
  /* 0xBA */ uint8_t attack_enabler;
  /* 0xBB */ uint8_t com_file_id;
  /* 0xBC */ uint8_t level;
  /* 0xBD */ uint8_t str;
  /* 0xBE */ uint8_t vit;
  /* 0xBF */ uint8_t mag;
  /* 0xC0 */ uint8_t spr;
  /* 0xC1 */ uint8_t spd;
  /* 0xC2 */ uint8_t luck;
  /* 0xC3 */ uint8_t eva;
  /* 0xC4 */ uint8_t hit_percent;
  /* 0xC5 */ uint8_t hit_element;
  /* 0xC6 */ uint8_t hit_element_percent;
  /* 0xC7 */ uint8_t target_reaction_type;
  /* 0xC8 */ uint8_t attack_sequence_id;
  /* 0xC9 */ uint8_t scripted_invuln_flag;
  /* 0xCA */ uint8_t crisis_level;
  /* 0xCB */ uint8_t _pad_CB;
  /* 0xCC */ uint16_t damage_accumulator;
  /* 0xCE */ uint8_t _pad_CE[2];
} FF8BattleSlotData_s;

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
extern FF8BattleSlotData_s BATTLE_SLOT_DATA[];
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
