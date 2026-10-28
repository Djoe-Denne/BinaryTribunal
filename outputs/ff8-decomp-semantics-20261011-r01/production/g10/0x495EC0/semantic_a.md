# Sémantique A — g10 / 0x495EC0 (2+1, volet A aveugle)

- Mission/tâche : ff8-decomp-semantics-20261011-r01 / task_mv44rwyu_009z_olnmx9
- Rôle : analyste sémantique A (pool-49), modèle attendu openai/gpt-6.1-sol medium
- Entrée gelée : `inputs/ff8-decomp-semantics-20261011-r01/g10/0x495EC0.json` (+ `.readable/`)
  - sha256 packet original `2e154d64…c08220`, compaction `2ccc15a8…9a7a01`
  - EXE sha256 `064d466b…589570`, export 2026-10-11T16:38:25Z, 16 instructions, 1 chunk 0x495EC0–0x495EE6 (38 octets)
- Règle aveugle appliquée : `name_label_only`, noms de symboles des opérandes
  (`SG_ARRAY_*`, `domain__*`) et commentaires IDA inline du gel n'ont **pas** servi de
  preuve. Seuls opcodes/bytes/CFG/xrefs ont été utilisés. Aucune lecture de l'autre volet,
  d'un review, d'un C ou d'un ledger.

## 1. Verdict

| Champ | Valeur |
|---|---|
| Rôle (mécanique) | Boucle do-while sur 16 enregistrements de 0x44 octets à partir de 0x01CFDCB9 ; pour chaque enregistrement dont l'octet-drapeau a le bit 0 à 1, appelle `sub_495D80(index)` |
| Confiance mécanique | **CERTAIN** |
| Confiance rôle métier | **LIKELY** (voir §5 : repose sur la forme du tableau + connaissance de domaine non gelée, pas sur un nom) |
| Nom proposé | `Battle_RefreshAllFlaggedGfRecords` (LIKELY) ; nom neutre de repli si le métier est rejeté : `ForEach16Records_IfFlagBit0_CallSub495D80` |
| Convention | cdecl, 1 argument pile côté callee, **aucun argument** pour cette fonction, retour `void` |

## 2. Entrées / sorties / effets

- **Entrées** : aucun argument (aucune lecture de `[esp+x]`, aucun registre d'entrée lu avant écriture).
  Lit la mémoire globale : octets de drapeau à `0x01CFDCB9 + 0x44*i`, i = 0..15.
- **Sortie** : aucune valeur de retour définie. EAX/ECX/EDX sont ceux laissés par le dernier
  `call` (ou par rien si aucun enregistrement n'est drapeauté) ; EAX n'est pas écrit par
  cette fonction → l'appelant ne doit pas le lire. Flags non définis à la sortie.
- **Effets** : uniquement ceux de `sub_495D80` (inconnus ici). Cette fonction n'écrit
  elle-même aucune mémoire globale (le seul accès mémoire est `test byte ptr [esi],1`,
  lecture seule). Pas de local, pas de `sub esp`.
- **Registres** : ESI et EDI sauvegardés (`push`) / restaurés (`pop`, ordre LIFO correct).
  EAX/ECX/EDX volatiles clobbered par le callee.
- **Pile** : équilibrée ; `add esp,4` après chaque call (cdecl, nettoyage par l'appelant), `retn` sans immédiat.

## 3. Reconstruction mécanique (pseudo-code, non C final)

```
void f(void) {
    uint8_t *p = (uint8_t*)0x01CFDCB9;   // esi
    int i = 0;                            // edi (32 bits)
    do {
        if (*p & 1)                       // test byte [esi],1 ; jz saute si bit0 == 0
            sub_495D80(i);                // push edi ; call ; add esp,4
        p += 0x44;                        // add esi,44h
        i++;                              // inc edi
    } while ((int32_t)p < (int32_t)0x01CFE0F9);   // cmp esi,imm ; jl (signé)
}
```

Calcul du nombre d'itérations : 0x01CFE0F9 − 0x01CFDCB9 = 0x440 = 1088 = 16 × 0x44 → **exactement 16
itérations** (i = 0..15), sortie quand ESI = 0x01CFE0F9 (non `<`). Signedness du `jl` sans
effet : toutes les valeurs < 0x80000000 (signé = non signé). Boucle do-while : le corps
s'exécute au moins une fois (pas de pré-test, borne constante).

## 4. Preuves (instruction / xref)

1. `00495EC4 mov esi, 0x01CFDCB9` + `00495EDB cmp esi, 0x01CFE0F9` (bytes `be b9 dc cf 01`,
   `81 fe f9 e0 cf 01`) : pointeur de balayage borné par une constante ; delta = 0x440.
2. `00495ED7 add esi, 44h` (bytes `83 c6 44`) : stride 0x44 = 68 octets ; 0x440 / 0x44 = 16 →
   **16 enregistrements**, borne cohérente avec le pas (aucun résidu → pas de dépassement).
3. `00495EC9 test byte ptr [esi],1` (`f6 06 01`) + `00495ECC jz +9` (`74 09`, cible 0x495ED7) :
   garde sur **le bit 0** d'un seul octet du enregistrement ; si 0, saute le call et l'argument.
4. `00495ECE push edi` (`57`) / `00495ECF call 0x495D80` (`e8 ac fe ff ff` : 0x495ED4 − 0x154 =
   0x495D80, concorde avec `code_targets`) / `00495ED4 add esp,4` (`83 c4 04`) : appel cdecl
   à 1 argument dword = index d'itération.
5. `00495EC2 xor edi,edi` ; `00495EDA inc edi` (`47`) : EDI est l'index 0..15, incrémenté à chaque
   tour, y compris quand le call est sauté (le `jz` cible 0x495ED7 qui précède `add esi`/`inc edi`) →
   l'index passé reste aligné sur la position dans le tableau.
6. CFG (5 blocs) : 0x495EC0→0x495EC9 ; 0x495EC9→{0x495ECE, 0x495ED7} ; 0x495ECE→0x495ED7 ;
   0x495ED7→{0x495EC9 (retour arrière), 0x495EE3} ; 0x495EE3 = épilogue. Structure
   `if` imbriqué dans boucle, une seule sortie.
7. xrefs vers la fonction (type 17 = appel code) : appels depuis les fonctions 0x48B7E0
   (@0x48B89D), 0x48E620 (@0x48E813), 0x4971F0 (@0x497220). Trois appelants, tous des
   appels directs ; la fonction est donc un point d'entrée commun « sans paramètre ».

## 5. Interprétation métier (distincte des faits)

- **Fait** : 16 × 0x44 octets, drapeau bit 0 par enregistrement, appel d'un callee par
  index, adresses dans la région globale 0x01CFxxxx (données statiques/globales de l'EXE).
- **Interprétation (LIKELY, non gelée)** : la forme « 16 enregistrements de 68 octets, drapeau
  bit 0 de présence, adresse dans le bloc de données de sauvegarde en mémoire » correspond à
  un tableau d'entités de roster à 16 entrées (cohérent avec la connaissance publique de
  FF8 : 16 GF × 68 octets). Le callee `sub_495D80(index)` serait donc une routine de
  (re)calcul de données dérivées par entité ; la fonction l'applique à toutes les entités
  « présentes » — typiquement une phase de finalisation/rafraîchissement avant l'entrée en
  combat. Cette lecture **n'est pas** prouvée par les opcodes seuls : le sens du bit 0, la
  nature du tableau et le rôle de `sub_495D80` ne sont pas dans le gel. Ne pas promouvoir
  au-delà de LIKELY sans lecture du callee et des champs.
- **Hypothèses écartées/non retenues** : pas de modification du tableau ici (lecture seule) ;
  pas de lien avec les valeurs de retour du callee (ignorées, EAX jamais testé).

## 6. Divergences / vigilance pour C et R

- Signedness : `jl` signé sur des adresses < 0x80000000 — équivalent à un `<` non signé ;
  ne pas introduire de wrap.
- L'index poussé est un **dword** (`push edi` 32 bits) ; la largeur réellement consommée par
  le callee est à vérifier côté callee (octet ? entier ?).
- La borne de fin 0x01CFE0F9 n'est pas une adresse de fin « propre » du tableau : elle est
  égale à base + 16×0x44 avec le même décalage de +1 octet (0x…B9 / 0x…F9). Cela indique que
  0x01CFDCB9 n'est pas le début de l'enregistrement mais l'adresse **de l'octet-drapeau dans
  le premier enregistrement** (début d'enregistrement probable 0x01CFDCB9 − k, k = offset du
  drapeau dans la structure, ici non déterminable avec le gel ; le drapeau est le premier
  octet testé, `[esi]` sans déplacement). Ne pas écrire en C un début de tableau ni un offset
  de champ non prouvé ; utiliser l'adresse brute du drapeau (ou un offset symbolique `k`).
- Si l'on exprime en C avec une structure, ne rien supposer sur les octets autres que le bit 0
  du premier octet testé.

## 7. Questions ouvertes

1. Quelle structure (début, taille réelle, offset du drapeau) contient `0x01CFDCB9` ? Un
   gel d'xrefs de données sur ce symbole/adresse trancherait le §5.
2. Que fait `sub_495D80(index)` : champs lus/écrits, largeur de l'argument, retour, effets
   globaux ? Nécessaire pour fixer le nom métier et pour le C (déclaration du prototype).
3. Sens exact du bit 0 (présence/activation) : confirmer par un second site utilisateur du
   même octet (non fourni ici).
4. Contexte des trois appelants (0x48B7E0, 0x48E620, 0x4971F0) : ils appellent-ils tous dans
   une phase unique (entrée de combat) ? Non déduit du gel (xrefs seulement, sans ASM
   appelant).
5. Le callee peut-il modifier le tableau parcouru (ex. effacer le bit 0) pendant la boucle ?
   Sans impact sur le décodage de cette fonction (relecture à chaque tour), mais sur le C
   de l'appelant oui.

## 8. Limites

- Aucun accès au callee, aux appelants ni à des xrefs data → rôle métier plafonné à LIKELY.
- Les noms/commentaires présents dans le gel (étiquette de fonction, symboles d'opérandes, commentaire
  IDA sur la première instruction) ont été délibérément ignorés comme preuve (ancien nom ≠ preuve).
- Pas de vérification IDA/live ; décodage fait à la main depuis les bytes (concordance avec le
  désassemblage fourni vérifiée instruction par instruction : 16/16).
