# TextureRelated @ 0x41AC34

- Confiance : **LIKELY**.
- Nom catalogue : **trop large** ; proposition markdown seulement : `Texture_LoadDataWithOptionalTIMCacheBuild` ; aucun rename catalogue/IDB.
- Mode/provenance : **A/V Sol**, analyse A et review V acceptée ; C nouveau issu de deux contextes Sol réconciliés, sans diversité de modèles revendiquée.
- A==V : **oui** ; verdict V **ACCEPTE**, zéro désaccord.
- §5.6 parent : 155 instructions / 22 blocs, 11 calls / neuf cibles et cleanups, deux xrefs CODE/cdecl trois mots, signedness, largeur BYTE/DWORD, sortie 12 octets et retour EAX relus live.
- PUSH IDB : `set_func_cmt` append-only `[semantic-triple 2026-10-08]`, tag relu ; `save_database=true` vérifié après le push. Aucun rename ni patch octets.
- Couverture rapportée par A/V : **155 instructions / 22 blocs CFG / 11 CALL / 9 callees / 2 callers**, un chunk `[0x41AC34,0x41AE9D)`, 617 octets.
- Sources : `tools/_tmp_semantic_triple/0x41ac34/semantic_a_sol.md` et `semantic_v_sol.md` ; C réconcilié : [livrable decomp](../decomp/0x41AC34__TextureRelated.md). Copie documentaire, pas preuve de safety.

## Contrat retenu

- Rôle : charge ou partage des données texture, avec génération optionnelle d'un fichier cache depuis une source de signature TIM, puis rend erreur, métadonnées source et données finales.
- ABI : `DWORD * __cdecl(DWORD *out, BYTE *descriptor, const char *original_path)` ; trois mots x86 poussés droite→gauche, nettoyage caller de 12 octets. **EAX entier = out** ; sortie de **12 octets**, trois DWORDs ordonnés : `out+0 = erreur`, `out+4 = metadata VA`, `out+8 = data VA`. Ni BOOL scalaire ni triplet par valeur ; `0` signifie aucun échec enregistré, pas garantie de données non nulles.
- Entrées : flags DWORD `descriptor+0`, sélecteur DWORD `+8`, adresse embarquée `+0x48`, valeurs DWORD `+0x5C/+0x60`, chemin original. Pas de garde générale des arguments ni de layout complet démontré.
- Parcours : flag `0x200` posé → chemin original, sinon nom dérivé `.TEX`. `descriptor+8 != 0` → acquisition source, réglages metadata, conversion whole-image, écriture cache, release temporaire, reload ; sinon chargement direct avec metadata nulle. Échec writer ne saute ni release ni reload. En génération, reload nul **n'ajoute pas d'erreur** ; en direct, il produit erreur 1.
- Effets : lecture/écriture de fichiers et cache mémoire via helpers, acquisition/release de références, mutations DWORD des métadonnées et BYTE des données, diagnostic sur erreur. Pas d'upload GPU ni de thread-safety établis.

## Preuves EA (8, issues de A/V)

1. **Couverture et ABI** : callers `0x4076FC` dans `0x4076B6` et `0x4153F7` dans `0x415372` poussent trois mots, nettoient `0x0C` et lisent `[eax]/[eax+4]/[eax+8]`. Stores cible `0x41AE82/0x41AE8A/0x41AE93`, retour pointeur `0x41AE96`, `retn` sans immédiat `0x41AE9C`. SHA-256 des 617 octets rapporté identique au pack : `1e945f301432a54e656c884590070faec3ca49f973e84eeeffea274b33b31c1c`.
2. **Choix du nom, formatage non borné** : masque `0x200` à `0x41AC42–0x41AC4A`, stem à `0x41AC68`, format à `0x41AC88`. Littéraux `0xB71D40 = "TEX\0"`, `0xB72234 = "%s.%s\0"`. Helper `0x40EDE1` utilise l'entrée comme format ; recherche arrière du point, BYTE zéro à `0x40EE2F`, comparaisons signed `jle/jl` à `0x40EDFF/0x40EE19` : pas une copie sûre.
3. **Initialisation et sélecteur** : `0x41AC96–0x41AC99` appelle le zero helper `(12,destination)`, deux arguments count-first, pas un `memset` à trois arguments. `0x41ACAE–0x41ACB2` teste le DWORD entier `descriptor+8` contre zéro, pas un BYTE ni une positivité.
4. **Source TIM et conversion** : acquisition `0x41ACC6 → 0x41BB7C`, wrapper `0x41BB98 → 0x41B638` ; lecteur masque `0xFF` et compare `0x10` à `0x41B6EB/0x41B6F1`, rejette deuxième octet non nul à `0x41B6FF–0x41B706`, teste palette `flags&8` à `0x41B712`. Réglages DWORD metadata `+0x34` à `0x41ACE7/0x41AD00`, `+0x30/+0x40` à `0x41AD13/0x41AD22`. Dispatch `0x41AD30`, entrée `0x41D4C6–0x41D4CA` forçant whole-image : le nom tiled ne prouve pas une voie tiled active.
5. **Écriture et release après échec** : flag `0x20` → affectation **BYTE** `temporary+0xCC=1` à `0x41AD50`, sans garde null. Writer `0x41AD62`, test full EAX `0x41AD6A`, erreur si zéro `0x41AD6E` ; écriture initiale `0xF0` à `0x41A8DA`, helper `0x40E85C → __write` avec comparaison du compte. Retour writer EAX 0/1 à `0x41AA21/0x41AA2A`. Release `0x41AD7F` puis reload `0x41AD9C` même après échec writer.
6. **Références et adresse embarquée** : loader reçoit `(descriptor+0x48,cache_name)` à `0x41AD98–0x41AD9C` et `0x41ADED–0x41ADF1`, pas le contenu de `descriptor+0x48`. Hit cache : incrément DWORD `entry+0x10` à `0x41A75B–0x41A764`, retour `entry+0x14` à `0x41A76D`, backlink `data+0xD4` à `0x41A7B9`. Release décrémente `entry+0x10` à `0x41A4A1–0x41A4A7`, teste **signed `jg`** à `0x41A4B1/0x41A4C9` ; appel `sub_41A3B0(entry+0x14)` à `0x41A4BA` dès premier compteur `<=0`, avant test du second compteur. Pas un contrat « free seulement si second compteur ==0 ».
7. **Erreur asymétrique et mutations finales** : génération `0x41ADCE–0x41ADD4` reprend uniquement erreur acquisition/writer, sans test du reload ; direct `0x41ADFF–0x41AE06` teste data nul. Erreur → diagnostic du chemin original à `0x41AE37/0x41AE46`. Sinon flag `0x80000` à `0x41AE53–0x41AE55` → **BYTE read-modify-write OR `0x20`** sur `data+0xCD` à `0x41AE65/0x41AE6B/0x41AE73`, sans garde null finale.
8. **Qualification et nom proposé** : chaîne source TIM (`0x41ACC6`, `0x41B6EB–0x41B706`) et chaîne écriture/reload (`0x41AD62`, `0x41AD9C`) fondent indépendamment `Texture_LoadDataWithOptionalTIMCacheBuild`. C réconcilié concordant selon A/V, mais accord des contextes non probant à lui seul. Wiki caller `0x4076B6` aligné ; `TextureRelated2 @ 0x419D8F` est une autre cible. Pas d'ancrage documentaire propre à cette cible autorisant CERTAIN.

## Risques et questions ouvertes

- Formatage non borné, entrée employée comme format ; trois spans scratch de 256 octets ne constituent pas une preuve de bornage. Pas d'équivalence garantie sous overflow, alias hostile de stack ou faults.
- Dispatch nul non gardé avant `temporary+0xCC` ; reload nul non gardé avant `data+0xCD`. En génération, erreur zéro peut coexister avec data nul et conduire à un accès invalide si flag `0x80000` posé ; occurrence runtime non établie. Ne pas ajouter de garde comme prétendue restitution ASM.
- Sens métier exact du sélecteur, des flags et champs metadata, propriété/durée de vie des métadonnées rendues non établis ; aucun free supplémentaire à inventer.
- Inspection transitive ciblée, non exhaustive (`0x41BC76`, 1379 instructions, non analysé intégralement). Aucun build/exécution C, comparaison PE ou observation mémoire du processus jeu. « Live » désigne l'IDB lue par A/V, pas une campagne runtime ; hypothèses C x86-32, little-endian, DF=0 et mémoire valide, sans claim de safety.
