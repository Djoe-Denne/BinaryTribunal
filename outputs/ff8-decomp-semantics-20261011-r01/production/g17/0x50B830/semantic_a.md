# Semantic A — g17 / 0x50B830

## Identité et provenance

- Mission `ff8-decomp-semantics-20261011-r01`; tâche `task_mv44siqk_00bz_jvptkv`; auteur `pool-220`, session `ses_ecf0801f7fferlc2Wh7v764APx`; volet sémantique A indépendant, 2+1.
- Modèle admis : `openai/gpt-6-astra`, variante `high`, égalité au routage persisté attestée par le lead dans `INPUT-ADMISSION-HARDENING-v1`. Ancienne mention Sol high non applicable. Pas de changement de modèle local.
- Checkpoint factuel révision 2, source `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, frontière exclusive `msg_12be1cd49001BowbZIVfuXq4cy`, huit messages : provenance et indépendance attestées par le lead. Aucune lecture d'auteur frère, autre volet, review ou verdict.
- Entrées lues : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x50B830.readable/{manifest.json,asm-001.txt…asm-008.txt,bytes-001.txt,bytes-002.txt,metadata.json}`, `g17/common-compaction.md`, et `g17/0x50B830.supplemental-v1/{manifest.json,table.json,provenance.json,dispatch.txt}` sous la même racine inputs. Les 195 lignes ASM, les octets du chunk `[0x50B830,0x50BADF)` et les huit entrées de table ont été lus.
- Hash original : `e89c8ab63b9fd82b3051f599dea4bcd4e2d1bc49457d7a0afe239ac230aafbbf`; compaction : `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`; manifeste readable : `ee68ab702a3c81b773646633c43449c19551c802e947faf107877e9368d0cf82`; manifeste supplément : `ddf0c47e293841fdd067f43f05b0f582c733984a96d5a3317883a75f157a8e3a`. Hashes fournis/attestés parent, **non recalculés ici**.
- Natif x86 32 bits, EXE SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`. Capture originale du 2026-10-11; supplément statique du 2026-10-12. Égalité gel/IDB/PE attestée dans `supplemental-v1/provenance.json:10–28`, pas vérification live par cet auteur.

Les références `R/` ci-dessous désignent le répertoire `0x50B830.readable/`, `S/` le répertoire `0x50B830.supplemental-v1/`, et `C` le fichier `g17/common-compaction.md`.

## Rôle et confiance

**CERTAIN, mécanique :** automate réentrant par appels successifs, piloté par l'octet `node+0x0D`, qui prépare un contexte global et une sélection de trois enregistrements, attend des conditions externes, invoque un callback global, puis déroule des opérations conditionnelles sur ces enregistrements avant signalement final. Il renvoie exactement `EAX=0` sur les sorties intermédiaires/default et `EAX=2` sur la sortie finale normale. Plusieurs étapes peuvent s'enchaîner dans un même appel; « un appel = une étape » serait faux.

**UNCERTAIN, interprétation métier précise :** orchestration d'une présentation d'action de combat avec restauration d'acteurs. Cette lecture est cohérente avec le contexte factuel commun et les appels de configuration/restauration, mais les noms de helpers, la notion de « Special » et le caractère exclusivement visuel ne sont pas prouvés par les corps des callees disponibles. Ni une exclusion de dégâts/statuts/stocks ni une identification GF particulière n'est établie.

**Nom proposé :** `BattleActionSequence_TickCallbackAndRestoreActors`.

**Verdict nom : UNCERTAIN pour sa portée métier; CERTAIN pour le noyau descriptif callback + progression + restauration de bits/enregistrements.** Deux preuves indépendantes minimales : P4 démontre l'invocation du callback et la progression persistée; P7 démontre la boucle de restauration sélectionnée et le marqueur final. P1 établit indépendamment le caractère tick/automate. Le nom historique `BattleActionSequence_Tick_Special` est une annotation, pas une preuve ni un nom confirmé. Variante strictement mécanique si nécessaire : `TickCallbackSequenceAndRestoreSelectedRecords`.

## Entrées, ABI et sorties

- Un argument DWORD sur pile, traité comme pointeur `node`. `EBP=node`; sauvegarde/restauration EBP/ESI/EDI; `RET` sans immédiat : convention à nettoyage appelant compatible cdecl, pas prototype complet authentifié.
- Lecture de `BYTE [node+0x0D]` et `DWORD [node+0x10]`. Ce dernier est capturé dès l'entrée dans le slot d'argument sur pile et réutilisé à la fin; ce n'est **pas** une relecture tardive de `node+0x10`. Le slot d'argument est effectivement écrasé, pas le champ `node+0x10`.
- La cible capturée reçoit `BYTE [target+1]=0xFF` uniquement à la sortie finale. Le champ d'état du node est incrémenté en largeur 8 bits aux points indiqués ci-dessous, sans écriture systématique d'un état terminal 8.
- Dépendances globales : pointeur descripteur à `0x01D99A50`, mots descripteur `+4/+6`, masque bas de `0x01D99A6C`, trois records à `0x01D972C0`, callback à `0x021DFEC4`, valeur d'attente signée à **`0x01D999C8`**, et divers flags.
- `EAX=0` et `EAX=2` sont des retours complets 32 bits, non des contrats seulement AL/AX. « En attente » / « terminé » est l'interprétation probable de ces constantes; le consommateur du retour n'est pas fourni. L'EAX du callback est stocké intégralement à `0x01D96AAC`, mais **n'est pas** le retour propagé de cette fonction.
- Les valeurs helper transmises après `OR AH,0x10` restent des DWORDs : notamment à `0x50BA8F`, l'opération produit `helper_EAX | 0x1000` sans tronquer les autres bits du retour. À `0x50BA1C/0x50BA51`, un `AND 0xFF` préalable garantit au contraire un identifiant bas surmonté du bit `0x1000`.
- Pas de contrôles locaux généraux de nullité de node, target, descripteur ou callback. Contrats de validité, aliasing et effets des callees non établis.

## Déroulement mécanique borné par la table native

L'entrée écrit toujours `BYTE [0x01D99A56]=0xFF`, même pour un état hors table. L'état est zéro-étendu de BYTE en EAX; test **non signé** `>7` : retour 0. Table native exacte : `0→50B85A, 1→50B87E, 2→50B934, 3→50B9B9, 4→50B9C9, 5→50B9EE, 6→50BA2B, 7→50BA60`.

| État d'entrée | Opérations observables et contrôle |
|---|---|
| 0 | Appelle `0x508580(0x1A,0x40)`; si EAX non nul, retour 0. Sinon appelle `0x501190()`; si non nul, retour 0. Sinon incrémente `node+0x0D`, poursuit directement l'étape 1. |
| 1 | Lit le WORD descripteur+4; appelle `0x50A750()` sauf si ce WORD non signé est dans `[7,10]`. Pose les bits de contrôle, appelle `0x50AFC0()`, initialise le masque bas de `0x01D99A6C`. Pour chacun des trois records dont le bit 2 du premier octet est posé, appelle `0x50C090(record,0x0B)` puis ajoute son bit au masque. Appelle `0x501740(0x18,0,0x80)` et `(0x19,0,0x80)`. Recharge le pointeur descripteur, transmet son WORD+6 zéro-étendu et l'adresse `0x021DFEC4` à `0x50AF20`. Incrémente le BYTE d'état relu; retour 0. |
| 2 | Attend que le DWORD signé `0x01D999C8` soit non négatif, puis que chacun des trois records sélectionnés par le masque bas ait le bit 4 de son premier octet posé. Si une condition échoue, retour 0. Sinon appelle `0x46B440()`. Si le bit 4 du masque est posé, efface le bit 2 du WORD au début du troisième record et écrit 0 à son BYTE+0x61. Copie callback C4 vers C8, écrit 1 à `0x01D96DC4`, appelle le callback avec l'adresse `0x01D99A78`, conserve EAX à `0x01D96AAC`. Relit et incrémente le BYTE d'état; retour 0. |
| 3 | Appelle `0x50AED0()`; non-zéro → retour 0; zéro → incrément d'état puis étape 4 immédiatement. |
| 4 | Si masque bit 4, appelle `0x507080(record2[+4] & 0xFF,2,0)`, avec lecture DWORD puis masque. Incrémente l'état, poursuit étape 5. |
| 5 | Appelle `0x507070()`; non-zéro → retour 0. Si masque bit 4 : appelle `0x50B810(record2)`, recharge DWORD record2+4 puis appelle `0x507080((value & 0xFF) | 0x1000,2,0)`. Incrémente l'état, poursuit étape 6. |
| 6 | Appelle `0x507070()`; non-zéro → retour 0. Si masque bit 2 : appelle `0x507080((DWORD record1[+4] & 0xFF) | 0x1000,1,0)`. Incrémente l'état, poursuit étape 7. |
| 7 | Appelle `0x507070()`; non-zéro → retour 0. Pour chaque record sélectionné : pose son bit 2, appelle `0x509C10(record)`, transmet EAX OR 0x1000 à `0x505C00(record,value)`, appelle `0x50C090(record,0x0C)`. Appelle `0x50AE80()`, efface le bit 0x10 du DWORD flags global, écrit 0 au DWORD `0x01D99A64`, écrit 0xFF à target+1, retourne EAX=2. |

`record0=0x01D972C0`, `record1=0x01D9735C`, `record2=0x01D973F8`; stride **0x9C**, borne exclusive `0x01D97494`. Les sauts de boucle sont `JL` signés sur les adresses fixes; le décompte est trois, sans preuve d'une taille universelle de l'ensemble des acteurs. Shifts x86 par CL : indices locaux 0,1,2, donc aucune ambiguïté de débordement du masque dans ces boucles.

Les incréments byte après helpers ne sont pas des affectations rigides à des constantes : les helpers/callback peuvent théoriquement modifier l'état ou les globals. Le tableau décrit l'ordre natif; il ne suppose pas leur pureté. En état 2, le masque de contrôle des trois records est capturé une fois; dans la boucle de restauration, son octet est relu à chaque itération.

## Effets directs et indirects

- Directs : sentinel global `0x01D99A56=0xFF`; état du node; bit 0x80 de `BYTE [0x01D97705]` posé (bit 0x8000 du mot/base `0x01D97704`); bit 0x10 du DWORD `0x01D96A9C` posé puis effacé en fin de séquence; écriture du seul octet bas de `0x01D99A6C` pendant sélection; flags/byte+0x61 du troisième record conditionnels; bit 2 de chacun des records restaurés; sauvegarde callback `0x021DFEC8`; `0x01D96DC4=1`; stockage retour callback `0x01D96AAC`; effacement marker `0x01D99A64`; target+1 final.
- Le stockage du masque et les accès ultérieurs ne prouvent pas que les trois octets supérieurs de `0x01D99A6C` sont initialisés. Son nom DWORD n'autorise pas à remplacer les écritures BYTE par un clear DWORD.
- Indirects : tous les effets des appels directs et du callback. Les noms « son », « loader », « caméra », « animation » apportent du contexte historique, pas la preuve exhaustive de leurs effets. La fonction ne contient pas d'écriture locale identifiée HP/stock, mais cela **ne prouve aucune absence transitive** de mutation gameplay.

## Huit preuves indépendantes / provenance

1. **Dispatch persistant et unsignedness.** `0x50B831–0x50B853`, `R/asm-001.txt:2–12`, `S/dispatch.txt:1–12` : node+0D BYTE zéro-étendu, JA au-delà de 7, adresse table. `S/table.json:8–48` fournit les DWORDs LE et leur ordre; la séquence `5a b8 50 00 … 60 ba 50 00` confirme les destinations, sans dépendre des commentaires case IDA.
2. **Sélection de trois records.** `0x50B8B1–0x50B8EE`, `R/asm-002.txt:10–25`, `R/asm-003.txt:1–3` : filtre bit 2, helper avec argument 0x0B, masque `1<<index`, stride 0x9C et borne. `R/bytes-001.txt:5–6` donne les adresses numériques et immédiats correspondants.
3. **Préparation d'un callback depuis descripteur.** `0x50B90C–0x50B92B`, `R/asm-003.txt:12–21`, `R/bytes-001.txt:7–9` : pointeur descripteur rechargé, WORD+6 zéro-étendu, adresse du slot callback passée à `0x50AF20`, état incrémenté. Contexte callee factuel secondaire : `C:33` décrit une écriture de pointeur sélectionné à travers ce second argument; aucune cible runtime unique n'est déduite.
4. **Attente puis invocation.** `0x50B934–0x50B9B8`, `R/asm-004.txt:2–25`, `R/asm-005.txt:1–13` : test signé du global, sélection/bit 4 des records, copie C4→C8, `CALL EAX`, stockage retour complet et retour local 0. `R/bytes-001.txt:9–13` confirme les adresses et le `FF D0`.
5. **Asymétrie des records et paramètre 0x1000.** `0x50B9C9–0x50BA5D`, `R/asm-005.txt:18–25`, `R/asm-006.txt`, `R/asm-007.txt:1–7` : troisième record traité d'abord sans 0x1000 puis avec; deuxième record seulement avec; attentes `0x507070` intercalées. Les OR AH/CH ne sont pas des OR de l'octet bas. `R/bytes-001.txt:14–18` recoupe les opérations et les E8.
6. **AL/AX ne définissent pas le retour.** `0x50B930`, `0x50B9B3`, `0x50BAD9`, `R/asm-003.txt:24`, `R/asm-005.txt:9`, `R/asm-008.txt:19–20` : XOR EAX,EAX ou MOV EAX,2 avant RET. `MOV AL,[node+0D]` et `MOV AX,[descriptor+6]` ont d'autres usages locaux; pas de BOOL8 déductible.
7. **Restauration et clôture observable.** `0x50BA6D–0x50BADE`, `R/asm-007.txt:11–25`, `R/asm-008.txt:1–20` : boucle sélectionnée, pose bit 2, helper EAX OR 0x1000, argument 0x0C, effacement flags/marker, sentinel target+1, retour 2. Capture target à l'entrée démontrée par `R/asm-001.txt:5–7`; éviter de confondre target avec node.
8. **Limite de l'appelant et contexte ABI.** `R/metadata.json:322–328` contient uniquement une référence non-code type 1 de `0x50A812` dans `0x50A790`, pas une instruction CALL à la cible. Le mode d'enregistrement et la signification du retour ne sont donc pas prouvés par cette xref. Les RET nus et nettoyages explicites des arguments callees établissent seulement les observations ABI locales.

## Divergences, inconnues et limites

- **Erreur d'adresse dans la compaction :** `C:21` écrit `1D99C8` pour le DWORD signé d'attente. Les octets `A1 C8 99 D9 01` à `0x50B934` (`R/bytes-001.txt:9`) encodent **0x01D999C8**, non 0x001D99C8. Le texte présent utilise l'adresse native. Ce conflit de transcription n'affecte pas la structure du contrôle.
- `C:38` signale initialement l'absence de la table 0x50BAE0. Le supplément v1 comble cette lacune : aucune ambiguïté restante de correspondance état→bras pour les huit valeurs normales. Ce n'est pas une contradiction native.
- Le commentaire d'entrée `R/asm-001.txt:1` exclut dégâts/statuts/stocks; aucune preuve transitive fournie ne justifie ce verdict. Il est conservé comme annotation historique non validée, **non repris comme conclusion**.
- Quelle action métier distingue cette séquence des autres? Pourquoi les valeurs descripteur+4 de 7 à 10 évitent-elles `0x50A750`? Que représente le sentinel global `0x01D99A56`? Non résolu.
- Quels états/ressources font attendre `0x501190`, `0x50AED0`, `0x507070`? Leurs conventions de zéro/non-zéro sont observables ici, leur sens complet et leurs mutations ne le sont pas.
- Quelle cible de callback est réellement chargée, et que signifie son retour stocké? Aucune cible runtime, garantie de non-nullité ou restriction des effets n'est fournie.
- Pourquoi seul le troisième record est préparé/traité deux fois, le deuxième une fois, et le premier uniquement via les boucles communes? Cette asymétrie est native; aucun rôle de personnage précis n'est attribué.
- L'argument final capturé alias-t-il le descripteur global? Le node peut-il aliaser les records/globals ou être modifié par les helpers? Non établi; ne pas remplacer capture/relecture et ordre des appels par des équivalences supposées.
- L'état 7 n'est pas avancé après clôture; un nouvel appel avec le même node pourrait répéter la clôture. Le retrait du node sur retour 2 et le sens externe du 0xFF doivent être vérifiés chez le consommateur, hors gel présent.

**Livrable d'auteur seulement : aucune promotion, mutation IDB/git/registre/live ni validation §5.6 effectuée.**
