# Command ID and Command Arg Tables

## command_id Values

| command_id | Command | Evidence |
|------------|---------|----------|
| `0x01` | Attack | BP capture: player Attack confirm, a3=1 |
| `0x02` | Magic | Injection: cmd_id=0x02 + cmd_arg=0x02 cast "Fira" |
| `0x03` | GF | BP capture: player GF Ifrit confirm, a3=3 |
| `0x04` | Draw | Inferred from menu path (TBD runtime) |
| `0x05` | Item | Inferred from menu path (TBD runtime) |

## GF command_arg Values (Kernel GF IDs)

GF command_arg uses kernel ability/magic IDs, NOT sequential 0-based indices. The resolver computes `gf_index = command_arg - 64` to index into `K_GF_JUNCTIONABLE`.

| command_arg | Decimal | GF | gf_index | Evidence |
|-------------|---------|-----|----------|----------|
| `0x40` | 64 | Quezacotl | 0 | Kernel GF order (unconfirmed) |
| `0x41` | 65 | Shiva | 1 | Kernel GF order (unconfirmed) |
| `0x42` | 66 | Ifrit | 2 | **BP capture** at `BattlePendingAction_Write` |
| `0x43` | 67 | Siren | 3 | Kernel GF order (unconfirmed) |
| `0x44` | 68 | Brothers | 4 | Kernel GF order (unconfirmed) |
| `0x45` | 69 | Diablos | 5 | **Runtime** action globals: `CMD_ID=0x45` |
| `0x46` | 70 | Carbuncle | 6 | Kernel GF order (unconfirmed) |
| `0x47` | 71 | Leviathan | 7 | Kernel GF order (unconfirmed) |
| `0x48` | 72 | Pandemona | 8 | **Runtime** action globals: `CMD_ID=0x48` |
| `0x49` | 73 | Cerberus | 9 | **Runtime** action globals: `CMD_ID=0x49` |
| `0x4A` | 74 | Alexander | 10 | Kernel GF order (unconfirmed) |
| `0x4B` | 75 | Doomtrain | 11 | Kernel GF order (unconfirmed) |
| `0x4C` | 76 | Bahamut | 12 | Kernel GF order (unconfirmed) |
| `0x4D` | 77 | Cactuar | 13 | Kernel GF order (unconfirmed) |
| `0x4E` | 78 | Tonberry | 14 | Kernel GF order (unconfirmed) |
| `0x4F` | 79 | Eden | 15 | Kernel GF order (unconfirmed) |

**Quick confirmation method**: Dump `K_GF_JUNCTIONABLE` kernel table base and stride from `BattleAction_ResolveAndApplyDamage` case 254 to confirm all 16 values in one shot.

## COMMAND_TYPE_ID Values (at resolver)

These are the values of `COMMAND_TYPE_ID` when `BattleAction_ResolveAndApplyDamage` (`0x48FE20`) runs:

| COMMAND_TYPE_ID | Category | Kernel Table Source |
|-----------------|----------|---------------------|
| 1 | Physical/Attack | `BATTLE_SLOT_DATA[attacker]` |
| 2 | Magic | `K_MAGIC[action_id]` |
| 4 | Item | `K_ITEM[action_id]` |
| 6 | Draw | `K_MAGIC[action_id]` |
| 7, 23-27, 29-34, 38 | Command ability | `K_BATTLE_COMMAND_ABILITY[action_id]` |
| 8 | Enemy attack | `K_ENEMY_ATTACK[action_id]` |
| 16 | Slot (Selphie) | `K_MAGIC[action_id]` |
| 236 | Enemy attack variant | `K_ENEMY_ATTACK[action_id]` |
| 247 | Magic variant | `K_MAGIC[action_id]` |
| **254 (0xFE)** | **GF** | `K_GF_JUNCTIONABLE[action_id - 64]` |
