# Semantic A — 0x56D090

Volet A seul. Aucune lecture de semantic B, C, R, revue, index, score, IDB, live, ni délégation.

## Nom proposé

`apply_q12_axis01_rotation` — confiance **LIKELY**.

Le libellé historique `Mat3S16_MulByRotZ_Q12` (`metadata.json:3`, même chaîne dans l'enveloppe) n'est pas une preuve. Il reste compatible avec la lecture LIKELY seulement si l'on ajoute la convention non établie « axe 2 = Z ».

Deux preuves indépendantes pour le cœur du nom, plus une troisième pour le verbe « apply » :

1. **Géométrie des neuf WORD, root seul.** Les stores écrivent `low16(retour_56D100)` en +0 et +8, `low16(NEG32(retour_56D130))` en +2, `low16(retour_56D130)` en +6, zéro en +4/+10/+12/+14, et l'immédiat `0x1000` en +16. C'est le motif `[[a,-b,0],[b,a,0],[0,0,0x1000]]` en WORDS row-major de pas 2. Preuve : `asm-001.txt:11`, `:12`, `:13`, `:15`, `:20`–`:25` et les octets `66 89` / `66 C7` / `F7 D9`.
2. **Identité cos/sin échelle 4096, paquet ancien distinct.** `0x56D100` fait `FILD` dword signé, `FMUL` float `[0xB6B980]`, `FCOS`, `FMUL` float 4096, biais double `2^52+2^31`, `FSTP`, `ADD EAX,0x80000000`. `0x56D130` est la même forme avec `FSIN`. Donc `a` et `b` ne sont pas des retours génériques. Preuve : `common-compaction.md:14` et `:15`, indépendante du motif de stores. Les commentaires IDA `Fixed_Cos4096_Q12` / `Fixed_Sin4096_Q12` ne comptent pas.
3. **Application vers le second argument, pas simple écriture du motif.** Le root n'écrit pas les neuf WORD à travers arg1. Il passe `(base_locale, arg1)` à `0x56C270`. Le corps ancien de `0x56C270` copie cinq DWORD (20 octets) vers son second pointeur. Preuve root : `asm-001.txt:16`, `:18`, `:19` et `asm-002.txt:1`. Preuve effet mémoire : `common-compaction.md:16`.

`0x1000` = 4096 coïncide avec le facteur float 4096 du paquet ancien. Cela justifie le qualificatif Q12 comme lecture d'échelle, pas comme un type promu.

## Rôle

**CERTAIN, mécanique.** Bloc unique sans `Jcc`. Deux DWORD lus sur la pile entrante. Trois appels (`0x56D100`, `0x56D130`, `0x56C270`). Neuf WORD matérialisés dans un local de 32 octets. `RETN` sans immédiat : le root ne dépile pas ses arguments. `EAX` reçoit `ESI` tel qu'il sort du dernier appel. Aucun accès mémoire absolu dans les 102 octets.

**LIKELY, interprétation.** arg0 est l'entrée commune des deux helpers trigonométriques à échelle 4096. Le local est une rotation du plan des composantes 0 et 1, composante 2 fixée à l'unité `0x1000`. `0x56C270` écrit 20 octets via arg1 à partir de ce local. Le retour utile est arg1.

**Hypothèse non retenue comme fait.** Axe Z, row-major XYZ, nom historique `Mat3S16_MulByRotZ_Q12`, égalité exacte de `[0xB6B980]` à π/2048. La compaction laisse les conventions d'axe non résolues (`common-compaction.md:24`).

## Contrat

Convention d'entrée : `S` = `ESP` à l'entrée, avant `SUB ESP,20h`. `RETN` nu. Deux slots lus, aucun troisième slot lu.

| Slot | Accès root | Largeur / signedness | Rôle |
| --- | --- | --- | --- |
| arg0 `[S+4]` | `8B 7C 24 2C` à `0x56D095` | DWORD complet, `MOV`, pas `MOVSX` ni `MOVZX` | Poussé tel quel aux deux helpers. Signedness : aucune dans ce root. `FILD` signé seulement dans les corps anciens des helpers. |
| arg1 `[S+8]` | `8B 74 24 38` à `0x56D0B5` | DWORD complet, `MOV` | Second argument poussé à `0x56C270`. Candidat de retour. Le nom IDA `p_dst` n'est pas une preuve. |

### Retour

- **CERTAIN.** `0x56D0EE` est `8B C6` : `EAX` entier = `ESI` après `CALL 0x56C270`. Ce n'est pas un retour `AL` ni `AX`. Aucun test de flags n'alimente le retour. `EBX`/`EBP` ne sont pas écrits.
- **LIKELY.** `ESI` à cet endroit vaut encore arg1, car le seul écrit de `ESI` entre le chargement d'arg1 et le `MOV EAX,ESI` serait un clobber du callee, et le paquet ancien dit que `0x56C270` sauvegarde/restaure `ESI` (`common-compaction.md:7` et `:16`). Le root, lui, ne relit pas `[S+8]` après l'appel. La phrase de compaction « returns original second arg » est donc plus forte que les octets du root seuls.

### Locaux et effet mémoire

`SUB ESP,20h` réserve 32 octets. Base locale `L = S-0x20`, obtenue par `LEA EDX,[ESP+10h]` quand `ESP = S-0x30` (`asm-001.txt:16`).

| Offset | WORD écrit | Instruction | Octets |
| --- | --- | --- | --- |
| +0 | low16(EAX de `0x56D100`) | `0x56D0A9` | `66 89 74 24 10` |
| +2 | low16(NEG32 de EAX de `0x56D130`) | `0x56D0B9` | `66 89 4C 24 12` |
| +4 | 0 | `0x56D0C6` | `66 89 4C 24 1C` |
| +6 | low16(EAX de `0x56D130`), non nié | `0x56D0CB` | `66 89 44 24 1E` |
| +8 | même low16 que +0 | `0x56D0B0` | `66 89 74 24 18` |
| +10 | 0 | `0x56D0D0` | `66 89 4C 24 22` |
| +12 | 0 | `0x56D0D5` | `66 89 4C 24 24` |
| +14 | 0 | `0x56D0DA` | `66 89 4C 24 26` |
| +16 | `0x1000` | `0x56D0DF` | `66 C7 44 24 28 00 10` |

`NEG ECX` est `F7 D9` sans préfixe `66` : négation 32 bits, puis troncature par le store WORD. Ce n'est pas un `NEG r16`. Si le haut de EAX n'est pas nul, `low16(NEG32(x))` n'est pas `low16(NEG16(low16(x)))`. Aucun `SAR`, `SHR` ni `IMUL` dans ce root. Pas de stride 6 ici : le pas des stores est 2. Le stride 6 appartient au corps ancien de `0x56C090` (`common-compaction.md:17`), pas à ces instructions.

Octets `L+0x12`..`L+0x1F` non écrits par le root (18 octets initialisés sur 32). Le paquet ancien dit que l'empreinte atteignable via `0x56C270` est 20 octets au second pointeur, et que les octets résultat +18/+19 de `0x56C090` sont internes à ce résultat, pas le tail non initialisé de ce local.

### Pile des trois appels

Après les deux `PUSH EDI` encore présents, `0x56D0C4` pousse arg1 et `0x56D0C5` pousse `L`. Au `CALL`, de haut en bas : `L`, arg1, arg0, arg0. `ADD ESP,10h` (`83 C4 10`, `asm-002.txt:2`) retire 16 octets d'un coup.

**CERTAIN :** 4 DWORD poussés au total, 16 octets libérés, cadre `0x20` et `ESI`/`EDI` rééquilibrés avant `RETN`.
**LIKELY :** répartition 1+1+2, pas un appel à 4 arguments. Les deux helpers anciens finissent par `RET` sans pop, et `0x56C270` lit deux arguments. C'est la lecture de `common-compaction.md:7`, cohérente avec les pushes du root, pas un fait encodé par le seul `ADD ESP,10h`.

### Effets collatéraux

- **CERTAIN, root.** Clobber `EAX`, `ECX`, `EDX`. `ESI`/`EDI` sauvegardés et restaurés par ce prologue/épilogue. Pas de global. Pas d'opcode x87 dans les 102 octets. `XOR ECX,ECX` est placé après le store du `CX` nié et avant les stores de zéro.
- **LIKELY, callees anciens.** `0x56D100` / `0x56D130` consomment le dword en `FILD` signé et laissent un EAX échelle 4096 ; pas de modification du control word x87 montrée. L'arrondi dépend de l'environnement x87, non observé ici. `0x56C270` écrit 20 octets via arg1 et préserve `ESI`.
- Aucune preuve d'aliasing entre arg1 et le local, ni de propriétaire de la mémoire pointée.

## Ancres (8)

1. `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/asm-001.txt:4` — `0x56D095`, `8B 7C 24 2C`, arg0 DWORD.
2. `asm-001.txt:6` — `0x56D09A`, `E8 61 00 00 00`, cible `0x56D100` (`next 0x56D09F + 0x61`).
3. `asm-001.txt:9` — `0x56D0A2`, `E8 89 00 00 00`, cible `0x56D130`.
4. `asm-001.txt:12` — `0x56D0AE`, `F7 D9`, `NEG` 32 bits avant troncature.
5. `asm-001.txt:14` — `0x56D0B5`, `8B 74 24 38`, arg1.
6. `asm-001.txt:19` — `0x56D0C5`, `PUSH EDX`, base locale = premier argument du call.
7. `asm-002.txt:2` — `0x56D0EB`, `83 C4 10`.
8. `asm-002.txt:3` — `0x56D0EE`, `8B C6`, retour `EAX` complet.

Chemins d'ancres 2–8 : même dossier `0x56D090.readable/`.

## Trente-deux instructions

Bloc `0x56D090`–`0x56D0F6` exclus, 102 octets (`0x66`), 32 instructions, aucun successeur CFG. `asm-001.txt` = instructions 1–25, `asm-002.txt` = 26–32. Ce découpage de fichiers n'est pas un second bloc.

| # | EA | Octets | Opération | Ligne |
| --- | --- | --- | --- | --- |
| 1 | `0x56D090` | `83 EC 20` | `sub esp, 20h` | asm-001:1 |
| 2 | `0x56D093` | `56` | `push esi` | asm-001:2 |
| 3 | `0x56D094` | `57` | `push edi` | asm-001:3 |
| 4 | `0x56D095` | `8B 7C 24 2C` | `mov edi, [esp+2Ch]` arg0 | asm-001:4 |
| 5 | `0x56D099` | `57` | `push edi` | asm-001:5 |
| 6 | `0x56D09A` | `E8 61 00 00 00` | `call 0x56D100` | asm-001:6 |
| 7 | `0x56D09F` | `57` | `push edi` | asm-001:7 |
| 8 | `0x56D0A0` | `8B F0` | `mov esi, eax` | asm-001:8 |
| 9 | `0x56D0A2` | `E8 89 00 00 00` | `call 0x56D130` | asm-001:9 |
| 10 | `0x56D0A7` | `8B C8` | `mov ecx, eax` | asm-001:10 |
| 11 | `0x56D0A9` | `66 89 74 24 10` | store `SI` → local+0 | asm-001:11 |
| 12 | `0x56D0AE` | `F7 D9` | `neg ecx` | asm-001:12 |
| 13 | `0x56D0B0` | `66 89 74 24 18` | store `SI` → local+8 | asm-001:13 |
| 14 | `0x56D0B5` | `8B 74 24 38` | `mov esi, [esp+38h]` arg1 | asm-001:14 |
| 15 | `0x56D0B9` | `66 89 4C 24 12` | store `CX` → local+2 | asm-001:15 |
| 16 | `0x56D0BE` | `8D 54 24 10` | `lea edx, local` | asm-001:16 |
| 17 | `0x56D0C2` | `33 C9` | `xor ecx, ecx` | asm-001:17 |
| 18 | `0x56D0C4` | `56` | `push esi` arg1 | asm-001:18 |
| 19 | `0x56D0C5` | `52` | `push edx` local | asm-001:19 |
| 20 | `0x56D0C6` | `66 89 4C 24 1C` | store 0 → local+4 | asm-001:20 |
| 21 | `0x56D0CB` | `66 89 44 24 1E` | store `AX` → local+6 | asm-001:21 |
| 22 | `0x56D0D0` | `66 89 4C 24 22` | store 0 → local+10 | asm-001:22 |
| 23 | `0x56D0D5` | `66 89 4C 24 24` | store 0 → local+12 | asm-001:23 |
| 24 | `0x56D0DA` | `66 89 4C 24 26` | store 0 → local+14 | asm-001:24 |
| 25 | `0x56D0DF` | `66 C7 44 24 28 00 10` | store `0x1000` → local+16 | asm-001:25 |
| 26 | `0x56D0E6` | `E8 85 F1 FF FF` | `call 0x56C270` | asm-002:1 |
| 27 | `0x56D0EB` | `83 C4 10` | `add esp, 10h` | asm-002:2 |
| 28 | `0x56D0EE` | `8B C6` | `mov eax, esi` | asm-002:3 |
| 29 | `0x56D0F0` | `5F` | `pop edi` | asm-002:4 |
| 30 | `0x56D0F1` | `5E` | `pop esi` | asm-002:5 |
| 31 | `0x56D0F2` | `83 C4 20` | `add esp, 20h` | asm-002:6 |
| 32 | `0x56D0F5` | `C3` | `retn` | asm-002:7 |

Les quatre lignes de `bytes-001.txt` concaténées égalent le champ `chunks[0].hex` de l'enveloppe (`0x56D090.json:15`) :

- `bytes-001.txt:1` `0x56D090` … `F7 D9`
- `bytes-001.txt:2` `0x56D0B0` … `66 89 44 24 1E`
- `bytes-001.txt:3` `0x56D0D0` … `8B C6`
- `bytes-001.txt:4` `0x56D0F0` `5F 5E 83 C4 20 C3`

## CFG

Un seul bloc. `metadata.json:13`–`:15` et `0x56D090.json:19`–`:23` : start `0x56d090`, end `0x56d0f6`, `successors: []`. Pas de `Jcc`, pas d'arête interne. `metadata.json:187` et `manifest.json:7` : 32 instructions. Cibles directes `metadata.json:183`–`:185` : `0x56C270`, `0x56D100`, `0x56D130`. Aucun appel direct vers `0x6D9510`, `0x6CF070` ou `0x6ED1E0`.

## Xrefs entrants

27 sites, 27 fonctions appelantes, tous `type` 17 et `iscode` true. Compte compaction `common-compaction.md:21` = 27/27. Liste complète depuis `metadata.json` (ligne du champ `from`) :

| Ligne | From | Fonction |
| --- | --- | --- |
| 20 | `0x56CD8A` | `0x56CD50` |
| 26 | `0x56CE15` | `0x56CDD0` |
| 32 | `0x56CE6A` | `0x56CE30` |
| 38 | `0x56CED4` | `0x56CE90` |
| 44 | `0x56CF3F` | `0x56CEF0` |
| 50 | `0x56CF9F` | `0x56CF50` |
| 56 | `0x571D16` | `0x571C80` |
| 62 | `0x6E9ACD` | `0x6E9AB0` |
| 68 | `0x743676` | `0x7435E0` |
| 74 | `0x758456` | `0x7583C0` |
| 80 | `0x7613C6` | `0x761330` |
| 86 | `0x766996` | `0x766900` |
| 92 | `0x772276` | `0x7721E0` |
| 98 | `0x775936` | `0x7758A0` |
| 104 | `0x782B46` | `0x782AB0` |
| 110 | `0x7AE9F6` | `0x7AE960` |
| 116 | `0x7BC066` | `0x7BBFD0` |
| 122 | `0x7D5286` | `0x7D51F0` |
| 128 | `0x7F20E6` | `0x7F2050` |
| 134 | `0x80BBE6` | `0x80BB50` |
| 140 | `0x899F86` | `0x899EF0` |
| 146 | `0x8A03E6` | `0x8A0350` |
| 152 | `0x8AA496` | `0x8AA400` |
| 158 | `0x8C40B6` | `0x8C4020` |
| 164 | `0x8CD926` | `0x8CD890` |
| 170 | `0x8DD2F6` | `0x8DD260` |
| 176 | `0xB6561E` | `0xB65590` |

La compaction cite en exemple `0x56CD50`, `0x56CDD0`, `0x56CE30`, `0x56CE90`, `0x56CEF0`, `0x56CF50`, `0x571C80`, `0x6E9AB0`, et note que `0x6E9AB0` appelle aussi `0x6D9510` en `0x6E9ADC`. Ce partage n'est pas une preuve de rôle. Les sites au-delà de cet exemple sont dans la table ci-dessus ; leurs arguments d'appel ne sont pas dans ce gel.

## Confiance

| Énoncé | Niveau |
| --- | --- |
| 32 instructions, un bloc, deux DWORD lus, neuf WORD, `NEG` 32 bits puis troncature, `ADD ESP,10h`, retour `EAX=ESI` post-call, pas de global root | CERTAIN |
| arg0 interprété signé et transformé en cos/sin échelle 4096 | LIKELY (corps anciens, pas re-désassemblés dans cette session) |
| motif = rotation des axes 0/1, unité `0x1000` sur l'axe 2 ; `0x56C270` écrit 20 octets via arg1 ; retour = arg1 | LIKELY |
| le nom historique RotZ / Mat3S16 est le bon identité métier | UNCERTAIN (convention d'axe ouverte ; libellé exclu comme preuve) |
| conflit d'octets entre asm, bytes, métadonnées, enveloppe et faits root de la compaction | aucun CONFLICT observé |

## Divergences de sources

- Le texte asm nomme `p_angle`, `p_dst`, `var_*`, `Fixed_Cos4096_Q12`, `sub_56C270` et commente `pi/2048`. Les octets ne contiennent pas ces chaînes. Autorité : bytes et déplacements.
- Deux fichiers asm, un seul objet CFG.
- `common-compaction.md:7` affirme le retour du second argument « under callee preservation ». Les octets du root ne prouvent que `MOV EAX,ESI`.
- Le lead annonce 33 lignes de compaction. Le contenu lu va de la ligne 1 au dernier inventaire ligne 32 ; `offset 32 limit 2` ne renvoie pas de ligne 33 texte. Écart de décompte, pas un second fait ABI.
- La compaction ne liste que huit appelants en exemple ; `metadata.json` a les 27. Le compte 27 concorde.

## Limites et questions ouvertes

- Les corps `0x56D100`, `0x56D130`, `0x56C270`, `0x56C090` viennent du gel 2026-10-10 cité par la compaction, pas du paquet courant re-exporté. SHA256 anciens rapportés, non revérifiés ici : `56D100` `dc51b188b7ba9c66bef7b4635ce6777b461363c771a20c67319d9c0c59c59767`, `56D130` `e3fbedf53fc1e960ea14b765ccfe9e6e30d6039b15af152d6dd0d466f943962a`, `56C270` `e42ef98254ef434f57b74807b9fc70f67530a27fe78625224403677bfc8e3374`.
- Control word x87 et arrondi réel au site d'appel : inconnus. Ne pas substituer un cast C ou libm.
- Haut de EAX des helpers : inconnu, donc l'équivalence avec une négation 16 bits n'est pas acquise.
- Alias arg1 / local / arg0, durée de vie du buffer, contrat des 27 appelants : hors gel.
- Convention d'axe (2 = Z ?) et layout row/column au-delà du motif écrit : non tranchés.
- Tail `L+0x12..L+0x1F` non initialisé par le root. Ne pas le confondre avec les octets +18/+19 du résultat interne de `0x56C090`.
- `0x6D9510` et `0x6CF070` écrivent neuf WORD vers un pointeur et n'appellent pas `0x56C270` (`common-compaction.md:8`–`:9`). Contraste structurel seulement. Ne pas importer leurs `MOVSX` WORD ni le `IMUL`/`SAR` de `0x6ED1E0`.

## Provenance

Lu dans cette session, et rien d'autre :

- `inputs/ff8-decomp-semantics-20261011-r01/g34/common-compaction.md`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/manifest.json`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/asm-001.txt`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/asm-002.txt`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/bytes-001.txt`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.readable/metadata.json`
- `inputs/ff8-decomp-semantics-20261011-r01/g34/0x56D090.json`

Hashes cités, non recalculés (pas de shell). Le parent déclare PASS pour les six hashes paquet + compaction + quatre fichiers. Le manifeste les porte : original `manifest.json:4` `7bb9b2534bfc3019773f9afc75c646c12900602b494595a585455586a23c65d8` ; compaction `manifest.json:5` `f25865201fc77a97e108274fe16be8da7e9055939c3ca5acb337f78101be03d3` ; asm-001 `3c4057f9e8616c2f885564205e1e64e9c7780a5718e981bb85782fc19f881221` ; asm-002 `4b9939c95ca611e5815b7e73d6e446c4613793b9648a461aef6489cf19c9b75c` ; bytes-001 `8961db85cd217013df082928b902b53ddd36f4286315545d8fa550f22ff0e246` ; metadata `44c60b8017d6df672f3e50de189b177264a2a609f1be7577e36689526937b193`. Entrée PE32 citée par la compaction et `metadata.json` : `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export `2026-10-11T16:38:25.140966Z`. Aucun test exécuté ni inventé.

## Anomalie de contexte — distincte des faits ci-dessus

Lire ces fichiers gelés ne veut pas dire que le checkpoint historique a été projeté. Le board annonçait un checkpoint `rev 1` depuis `ses_ed41f7454ffeMmUT62aU0vibC0` avant `msg_12be25945001z1eTmeIwOzxKcZ`. Cette session n'a pas reçu cette projection : le premier tour ne contenait aucun fait natif, et les lectures hors liste étaient refusées. Les faits de cette note viennent uniquement de la relecture autorisée après le message du lead.

Validation fork et `Model.Ref` réservées au parent avant acceptance. Admission de tâche : `openai/gpt-6.1-sol` medium. Identité de modèle visible dans cette session : `cursor` / `grok-4.7`. Non promu ici.
