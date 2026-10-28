# Breakthrough Op178_SetSeqCtxA2 @ 0x8E55E0 (Astra)

- Post-mortem : le ledger ligne 553 conserve `CONFLICT` sans expliciter les versions adverses. Le livrable decomp indique exactement `A==B: non` (ligne 8), mais sa réconciliation et ses notes parent (ligne 11) concordent avec les octets live. Pack source sans fichier ; A/V/B/R indisponibles : impossible d'attribuer honnêtement une divergence précise à un analyste. Le désaccord documentaire identifiable est la collision de désignations « Op178 » : ancien alias PH9 de SubmitTIM versus index décimal 178 de STREAM16. La wiki `#6a1328:145` et `#4caff1:111` la distinguent déjà. ASM discriminant : `8A 48 02` / `88 8A A2 00 00 00` à 0x8E55EB/EE = copie BYTE ; aucun CALL, contrairement aux CALL 0x8E0439/0x8E0462 de 0x8E0420. Cette collision explique un risque de confusion, pas la cause historique démontrée de A≠B. Le statut semble résiduel ; son mécanisme de génération n'a pas été audité.
- Rôle (1 phrase, re-dérivé) : handler STREAM16 d'index 178 qui copie l'octet à IP+2 dans le contexte de séquence à +0xA2, puis recharge le curseur global et l'avance de quatre octets.
- Confiance : CERTAIN
- Nom catalogue : confirme ; `Op178_SetSeqCtxA2` décrit exactement l'effet, à conserver dans l'espace de noms STREAM16 (178 décimal = 0xB2), pas l'ancien alias PH9 SubmitTIM.
- In / Out / Effets : aucun argument pile lu ; entrées implicites DWORD `[0x2797450]` (IP) et `[0x27973EC]` (contexte). Lecture BYTE `[IP+2]`, écriture BYTE `[ctx+0xA2]`, puis relecture et écriture DWORD du curseur avec addition modulo 2^32 de 4. À RET, EAX contient ce nouveau curseur sur 32 bits, EDX le contexte chargé, CL l'octet copié ; les bits hauts d'ECX ne sont pas initialisés. Flags arithmétiques modifiés par ADD. Pas de CALL, branche, contrôle NULL, clamp, lecture IP+3 ni effet TIM direct. Le type IDA `int()` n'établit pas un résultat métier : les quatre sites indirects observés n'exploitent pas EAX retourné. Préconditions usuelles : mémoire lisible/inscriptible ; aucun domaine de validité des pointeurs n'est garanti par le handler.
- Preuves (10, opcodes cités) :
  1. **Entrées absolues** — 0x8E55E0 `A1 50 74 79 02` charge le DWORD IP dans EAX ; 0x8E55E5 `8B 15 EC 73 79 02` charge le pointeur contexte dans EDX. Ce ne sont ni adresses immédiates ni paramètres pile.
  2. **Largeur source** — 0x8E55EB `8A 48 02`, `mov cl,[eax+2]` : exactement 8 bits, sans lecture WORD du paramètre ; aucune extension signée dans ce setter.
  3. **Largeur destination** — 0x8E55EE `88 8A A2 00 00 00`, `mov [edx+0A2h],cl` : écrit un octet seulement, pas une structure, pas un mot A2/A3, pas un booléen normalisé.
  4. **Rechargement obligatoire** — 0x8E55F4 `A1 50 74 79 02` relit IP après l'écriture. Ne pas le supprimer sur la seule foi d'un pseudo-C : si la destination aliasait le stockage d'IP, ce rechargement serait observable. Sous non-alias usuel, IP_sortie=IP_entrée+4.
  5. **Avance et retour** — 0x8E55F9 `83 C0 04`, 0x8E55FC `A3 50 74 79 02`, 0x8E5601 `C3` : addition de quatre octets, store DWORD puis RET ; EAX entier demeure défini, pas seulement AL/AX. Huit instructions couvrent exactement 0x22 octets ; ensemble des callees vide, cohérent avec le corps intégral.
  6. **Identité du dispatch** — 0x8E96E0 `movsx eax,word ptr [edi]`, 0x8E96E7 `and eax,1FFh`, 0x8E96EC `call [0x1852A98+eax*4]`. Stride développé : 178×4=712=0x2C8 ; 0x1852A98+0x2C8=0x1852D60 ; DWORD lu live=0x8E55E0. L'index est les neuf bits bas du WORD, pas son octet bas.
  7. **Callers croisés et retour inutilisé** — même `and eax,1FFh` / appel indexé aux paires 0x8E970B/10, 0x8E9AFA/FF, 0x8E9B1E/23, dans les passes 0x8E9630 et 0x8E9A50. Après appels, comparaison du WORD `[slot+3Eh]`, puis rechargement IP avant opcode suivant : pas de test du retour EAX. Les xrefs directs vides sont donc un défaut de visibilité de l'indexation, pas du code mort démontré.
  8. **Sens local de A2** — consommateur Op6 : 0x8E54FB `xor ecx,ecx`, 0x8E54FD `mov cl,[ebx+0A2h]`, 0x8E5503 `add eax,ecx`, 0x8E5505 `mov g_MagicFileChunkTable[eax*4],esi`. A2 est consommé unsigned 0..255 comme biais d'index de pointeurs (stride 4). Pas de clamp A2 dans le setter ; ce fait ne borne pas à lui seul l'index final.
  9. **Usage aval, pas callee inventé** — Op6 ajoute ensuite le WORD signé à +0xA0 (`movsx edx,word ptr [ebx+0A0h]` à 0x8E550C), puis prépare le CALL 0x8E5529 par pushes callback, 0, ESI, EAX. Lecture cdecl droite→gauche : `(eax & 0xFFFF, esi, 0, callback)` ; dépilement `add esp,10h` à 0x8E5533. Cela rattache localement le biais au chemin de préchargement nommé dans IDA ; le setter lui-même n'appelle aucun loader.
  10. **Réfutation de l'alias TIM** — 49×4=0xC4 ; DWORD[0x1852A98+0xC4]=DWORD[0x1852B5C]=0x8E0420, non 0x8E55E0. Le premier corps possède `call` à 0x8E0439/0x8E0462 et `add eax,2` à 0x8E046F ; le second copie A2 et ajoute 4. Wiki récupérée intégralement : `#6a1328:145,248–256`, `#4caff1:111`, alignée avec ces opcodes et la table ; aucune revendication de preuve indépendante de sa provenance IDB.
- Hypothèses testables restantes :
  - **Origine historique exacte A≠B** : demander à l'orchestrator les sorties GLM A/B/C originales et/ou semantic_a/v/b/r archivés de ce VA ; comparer largeur BYTE, rechargement IP, retour et namespace. Leur absence empêche seulement l'attribution du désaccord, pas la clôture du comportement actuel.
  - **Domaine métier exhaustif de +0xA2 / borne de chunk** : recenser en lecture IDB les readers/writers de contexte+0xA2 et les producteurs de scripts. Ne pas promouvoir une borne universelle ni les 58 clones depuis ce seul exemplaire.
  - **Alias et validité mémoire** : pour une future traduction optimisée, croiser allocations du contexte et stockage global d'IP ; conserver en attendant la relecture après store. Vérification offline ciblée suffisante pour ce contrat mécanique ; aucune campagne live demandée ni lancée.
  - **Valeurs rencontrées en jeu** : non établies. Une observation runtime ne serait utile que si l'orchestrator exige une distribution de valeurs ou une preuve de sûreté de l'index aval, pas pour lever ce CONFLICT sémantique.
- Verdict pipeline recommandé : push semantic — promouvoir ce VA de CONFLICT à CERTAIN pour le contrat mécanique borné ci-dessus, garder le nom ; faire inscrire par l'orchestrator « ASM live + dispatch indirect + wiki concordants ; divergence historique non attribuable faute de sorties brutes ». Aucun changement du ledger ni de l'IDB effectué ici. Pas d'escalade live nécessaire.

## Re-dérivation opérationnelle

```text
ip_initial = load32(0x2797450)
ctx = load32(0x27973EC)
v = load8(ip_initial + 2)
store8(ctx + 0xA2, v)
eax = (load32(0x2797450) + 4) modulo 2^32
store32(0x2797450, eax)
RET                         // EAX observable, ignoré par les callers examinés
```

Pack reproductible : `pack_minimal.md` dans ce répertoire. Portée : IDB live consultée le 2026-10-02, pas une validation mémoire du processus jeu ; aucune écriture IDB, aucun git, aucun sous-agent. Le heading « Astra » reprend le contrat de livrable et ne constitue pas une attestation technique du routage fournisseur/modèle.
