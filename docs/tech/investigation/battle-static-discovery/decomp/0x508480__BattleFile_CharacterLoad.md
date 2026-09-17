# BattleFile_CharacterLoad @ 0x508480

- Instr: 10
- Mode: 1+P
- Verdict: CERTAIN — arme le résultat asynchrone à -1 puis délègue le préchargement avec le callback de stockage personnage
- Push IDB: append-only `[semantic-triple 2026-09-17]` + save_database

## C réconcilié

```c
int __cdecl BattleFile_CharacterLoad(int file_id, int destination)
{
    BATTLE_PRESENTATION_FILE_RESULT = -1;
    return BattleFile_preLoad(
        file_id,
        destination,
        0,
        BattleFile_StoreCharacterLoadResult);
}
```

## Preuves et validation parent

1. `508488 push offset BattleFile_StoreCharacterLoadResult` puis `push 0`, `push arg_4`, `push arg_0` — quatre arguments cdecl exacts.
2. `508491 mov BATTLE_PRESENTATION_FILE_RESULT,0FFFFFFFFh` — sentinelle -1 posée avant le lancement.
3. `50849b call BattleFile_preLoad`; aucun autre traitement; retour EAX 32 bits propagé directement.
4. Callers indépendants: initialisation acteur, chargeurs corps/arme/monstre, effets GF/magie. Tous utilisent le même adaptateur de chargement de ressource personnage/présentation.
5. Le callback `BattleFile_StoreCharacterLoadResult` est l'unique fermeture sémantique nécessaire: il stocke le résultat asynchrone dans le global armé ici.
