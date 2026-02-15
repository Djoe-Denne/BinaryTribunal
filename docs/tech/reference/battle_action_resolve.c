#include "battle_action_resolve.h"

// High-level, readable pseudocode for BattleAction_ResolveAndApplyDamage.
// This is intentionally faithful to the control flow seen in IDA while
// using clearer names and collapsing repeated patterns.

char BattleAction_ResolveAndApplyDamage(int target_slot_id) {
  int damage = 0;
  int attacker_slot_id = ATTACKER_SLOT_ID;
  uint8_t cmd = COMMAND_TYPE_ID;
  uint16_t action_id = CURRENT_ATTACK_MAGIC_GF_ITEM_COMMAND_ID;
  uint8_t related_param = EQUAL_GAME_OVER_RELATED;
  uint8_t shot_index = SHOT_INDEX;

  // Per-target pre-reset.
  BATTLE_SLOT_DATA[target_slot_id].flag_data &= ~0x00004000u;
  if (BATTLE_SLOT_DATA[target_slot_id].unknown2) {
    BATTLE_SLOT_DATA[target_slot_id].unknown2 -= 1;
  }

  // Reset hit context globals.
  HIT_TYPE_TARGET_ANIMATION_TO_PLAY = 0;
  HIT_TYPE_2 = 0;
  ATTACK_FLAG = 3;
  HIT_ELEMENT = 0;
  HIT_ELEMENT_PERCENT = 0;
  HIT_ATTACK_ENABLER = 0;
  HIT_STATUS_1 = 0;
  HIT_STATUS_2 = 0;
  HIT_ATTACK_HITPERCENT = 0xFF;
  RELATED_TO_CRIT_BONUS = 0;
  DAMAGE_DEAL = 0;

  // 1) Load metadata from the appropriate kernel table by command type.
  switch (cmd) {
    case 2:   // Magic
    case 6:   // Draw
    case 16:  // Slot
    case 247: // ?
      HIT_ELEMENT = K_MAGIC[action_id].element;
      HIT_ATTACK_ENABLER = K_MAGIC[action_id].status_attack_enabler;
      HIT_STATUS_1 = K_MAGIC[action_id].statuses0;
      HIT_STATUS_2 = K_MAGIC[action_id].statuses1;
      break;
    case 4:   // Item
    case 13:  // ?
      HIT_ATTACK_HITPERCENT = K_ITEM[action_id].attack_param;
      HIT_ELEMENT = K_ITEM[action_id].element;
      HIT_ATTACK_ENABLER = K_ITEM[action_id].status_attack_enabler;
      HIT_STATUS_1 = K_ITEM[action_id].status0;
      HIT_STATUS_2 = K_ITEM[action_id].status1;
      break;
    case 7: case 23: case 24: case 25: case 26: case 27:
    case 29: case 30: case 31: case 32: case 33: case 34: case 38:
      HIT_ELEMENT = K_BATTLE_COMMAND_ABILITY[action_id].Element;
      HIT_ATTACK_ENABLER = K_BATTLE_COMMAND_ABILITY[action_id].StatusAttackEnabler;
      HIT_STATUS_1 = K_BATTLE_COMMAND_ABILITY[action_id].status1;
      HIT_STATUS_2 = K_BATTLE_COMMAND_ABILITY[action_id].status2;
      break;
    case 8:   // Enemy attack
    case 236: // ?
      HIT_ELEMENT = K_ENEMY_ATTACK[action_id].attackElement;
      HIT_ATTACK_ENABLER = K_ENEMY_ATTACK[action_id].statusAttackEnabler;
      HIT_STATUS_1 = K_ENEMY_ATTACK[action_id].status0;
      HIT_STATUS_2 = K_ENEMY_ATTACK[action_id].status1;
      HIT_ATTACK_HITPERCENT = K_ENEMY_ATTACK[action_id].attackParameter;
      RELATED_TO_CRIT_BONUS = K_ENEMY_ATTACK[action_id].attackCritBonus;
      break;
    case 254: { // GF
      int gf_index = action_id - 64;
      HIT_ELEMENT = K_GF_JUNCTIONABLE[gf_index].element;
      HIT_ATTACK_ENABLER = K_GF_JUNCTIONABLE[gf_index].statusAttackEnabler;
      HIT_STATUS_1 = K_GF_JUNCTIONABLE[gf_index].statuses0;
      HIT_STATUS_2 = K_GF_JUNCTIONABLE[gf_index].statuses1;
      break;
    }
    default:
      // Fallback to attacker properties (physical baseline).
      HIT_ELEMENT_PERCENT = BATTLE_SLOT_DATA[attacker_slot_id].hit_element_percent;
      HIT_ELEMENT = BATTLE_SLOT_DATA[attacker_slot_id].hit_element;
      HIT_ATTACK_ENABLER = BATTLE_SLOT_DATA[attacker_slot_id].attack_enabler;
      HIT_STATUS_1 = BATTLE_SLOT_DATA[attacker_slot_id].hit_status_1;
      HIT_STATUS_2 = BATTLE_SLOT_DATA[attacker_slot_id].hit_status_2;
      HIT_ATTACK_HITPERCENT = BATTLE_SLOT_DATA[attacker_slot_id].hit_percent;
      // Crit bonus is weapon-based in this fallback.
      // (exact array omitted; see IDA for CURRENT_WEAPON_USED_ usage)
      break;
  }

  // 2) Compute raw damage/heal based on attack type.
  switch (cmd) {
    case 2: case 16: case 247: // Magic/Slot
      ATTACK_FLAG = K_MAGIC[action_id].attack_flags;
      HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_MAGIC[action_id].animation_triggered;
      damage = Damage_ComputeRawDeltaFromAttackType(
          K_MAGIC[action_id].attack_type,
          attacker_slot_id,
          target_slot_id,
          K_MAGIC[action_id].spell_power);
      break;
    case 4: case 13: // Item
      ATTACK_FLAG = K_ITEM[action_id].unknown2;
      HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_ITEM[action_id].attack_flags;
      damage = Damage_ComputeRawDeltaFromAttackType(
          K_ITEM[action_id].attack_type,
          attacker_slot_id,
          target_slot_id,
          K_ITEM[action_id].attack_power);
      break;
    case 7: case 23: case 24: case 25: case 26: case 27:
    case 29: case 30: case 31: case 32: case 33: case 34:
      ATTACK_FLAG = K_BATTLE_COMMAND_ABILITY[action_id].AttackFlags;
      HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_BATTLE_COMMAND_ABILITY[action_id].AnimationTriggered;
      damage = Damage_ComputeRawDeltaFromAttackType(
          K_BATTLE_COMMAND_ABILITY[action_id].AttackType,
          attacker_slot_id,
          target_slot_id,
          K_BATTLE_COMMAND_ABILITY[action_id].AttackPower);
      break;
    case 8: case 236: // Enemy
      ATTACK_FLAG = K_ENEMY_ATTACK[action_id].attackFlags;
      HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_ENEMY_ATTACK[action_id].animationTriggered;
      damage = Damage_ComputeRawDeltaFromAttackType(
          K_ENEMY_ATTACK[action_id].attackType,
          attacker_slot_id,
          target_slot_id,
          K_ENEMY_ATTACK[action_id].attackPower);
      break;
    case 6: // Draw
      if (related_param == 9) {
        ATTACK_FLAG = K_MAGIC[action_id].attack_flags;
        HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_MAGIC[action_id].animation_triggered;
        damage = Damage_ComputeRawDeltaFromAttackType(
            K_MAGIC[action_id].attack_type,
            attacker_slot_id,
            target_slot_id,
            K_MAGIC[action_id].spell_power);
        // draw-cast scales damage
        damage = damage * (GetRandomInt() + 10) / 150;
      } else if (related_param == 10) {
        // draw-stock: no damage
        damage = 0;
      }
      break;
    case 254: { // GF
      int gf_index = action_id - 64;
      ATTACK_FLAG = K_GF_JUNCTIONABLE[gf_index].attackFlags;
      HIT_TYPE_TARGET_ANIMATION_TO_PLAY = K_GF_JUNCTIONABLE[gf_index].unknown2;
      damage = Damage_ComputeRawDeltaFromAttackType(
          K_GF_JUNCTIONABLE[gf_index].attackType,
          attacker_slot_id,
          target_slot_id,
          K_GF_JUNCTIONABLE[gf_index].gfPower);
      break;
    }
    case 14: case 237: case 238: // Shot
      // Only for completeness; uses K_SHOT. Details omitted for brevity.
      // See IDA for full shot variants.
      damage = 0;
      break;
    case 12: { // Mug
      int mug_item_id = 0;
      int mug_qty = 0;
      (void)getMugObjectIdAndQuantity(target_slot_id, &mug_item_id, &mug_qty,
                                      BATTLE_SLOT_DATA[attacker_slot_id].spd);
      // Damage path continues below; item text handling omitted here.
      damage = DAMAGE_DEAL;
      break;
    }
    default:
      break;
  }

  // 3) Clamp to damage limit and apply.
  if (damage < 0) damage = 0;
  DAMAGE_DEAL = (uint16_t)damage;

  Battle_ApplyDamageOrHeal(
      target_slot_id,
      DAMAGE_DEAL,
      &HIT_TYPE_2,
      &ATTACK_FLAG,
      attacker_slot_id,
      &HIT_TYPE_TARGET_ANIMATION_TO_PLAY,
      NULL,
      NULL,
      0);

  // Drain handling omitted here; see IDA for second Battle_ApplyDamageOrHeal call.
  return 0;
}
