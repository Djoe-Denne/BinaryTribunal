"""Quick slot scanner — find which slots have live enemies.

Run before a hypothesis test to verify which enemy slots are populated.
Usage: python scan_slots.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "RE"))

from ff8re.mcp_client import McpClient
from ff8re.battle_state import FF8BattleState

mcp = McpClient()
battle = FF8BattleState(mcp)

print("=== Battle Slot Scan (0-10) ===\n")
print(f"{'Slot':>4} | {'HP':>6} | {'MaxHP':>6} | {'Status1':>10} | {'Status2':>10} | {'ATB_cur':>8} | {'ATB_max':>8} | {'Spd':>4} | {'TargMask':>10}")
print("-" * 95)

for i in range(11):
    try:
        snap = battle.snapshot_slot(i)
        hp = snap['current_hp']
        mhp = snap['max_hp']
        s1 = snap['status1']
        s2 = snap['status2']
        atb_c = snap['atb_cur']
        atb_m = snap['atb_max']
        spd = snap['spd']
        tm = snap['target_mask']
        alive = "ALIVE" if hp > 0 else ("DEAD" if s1 != '0x0' else "EMPTY")
        print(f"{i:>4} | {hp:>6} | {mhp:>6} | {s1:>10} | {s2:>10} | {atb_c:>8} | {atb_m:>8} | {spd:>4} | {tm:>10}  [{alive}]")
    except Exception as e:
        print(f"{i:>4} | ERROR: {e}")
