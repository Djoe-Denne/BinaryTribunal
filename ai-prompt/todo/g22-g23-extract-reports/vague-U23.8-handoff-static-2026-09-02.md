# Rapport U23.8 handoff — extraits IDA 2026-09-02

```text
Vague : U23.8-static
Date : 2026-09-02
Agent / outil : Cursor Grok 4.6 + IDA Hex-Rays
Rail : B2-DIR5 + P-G23
G23 core/ commencé : oui (`battle_handoff`)
satisfied proposé : false
```

## Chaîne Director extraite

```text
cleanup 0x4868C0
  → mode_StateGlobal = 5 (reward) ou 100 (field)
  → mode_Battle_AnimationState = 0
  → SFX stop

Director case 5 (mode==5)
  → 0x4A6680 packaging UI
  → mode_Battle_AnimationState = 4
  → mode_StateGlobal = 100

Director default (mode==100, 4, ou autre hors 3/5/8)
  → exit_battle = 1
  → mode_StateGlobal = 4 (ou 8 si cardgame)

FFBattleModule (0x47CF60)
  si exit_battle:
    anim==4 → init 0x4A2280 / exit 0x4A22A0 / loop 0x4A2690 (reward menu)
    sinon   → init 0x470690 / exit 0x4706A0 / loop 0x4706B0 (field handler)
```

`FFBattleExitSystem` `0x47CEF0` n’est pas appelé depuis case 5. C’est le restore de sortie de module (caméras, ctx+2952).

Wipe et timer partagent le **même** triple field handler. GameOver est sémantique (result 1 + destination), pas un callback distinct.

Victoire + `SCENE_OUT.battle_flags & 0x10` : cleanup pose déjà mode 100 → pas de case 5 → field handler.

## Implémentation

- `core/battle_handoff` : plan typé, zéro RVA.
- `application::ModuleHandoff` enrichi depuis le plan.
- `TemporaryG23NcompAdapter` : mapping kind → symboles, aucun appel natif. Removal U14.6.

## Hors ownership

- Install live du callback / `FFSwitchModule`.
- Replay UI reward / `BattleRewardMenu_MainLoop`.
- Result 5.
- U23.9 repeats.
