# pre_isBattle_DirectorReady @ 0x47D8E0

- Instr (live): 3
- Palier: high
- GLM A: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM B: fence_found=true finish_reason=stop reasoning_tokens=0
- GLM C: fence_found=true finish_reason=stop reasoning_tokens=0
- A==B: oui (C = commentaires seulement)
- Push IDB: oui
- SetType: int __cdecl pre_isBattle_DirectorReady();
- Notes parent: le nom est trompeur — le corps lit uniquement `IS_BATTLE_PAUSED` (byte @ `0x1D28DE9`, `mov al` / `and eax, 0FFh`). EAX = 0..255, pas d'inversion. Réconciliation Grok 4.6 Extra High.

## C réconcilié

```c
extern unsigned char IS_BATTLE_PAUSED;

int __cdecl pre_isBattle_DirectorReady(void)
{
    return (unsigned int)IS_BATTLE_PAUSED;
}
```
