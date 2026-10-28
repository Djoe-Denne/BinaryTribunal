# Sémantique A — 0x509C80

## Identité et provenance
- Mission run01 ; groupe g17 ; tâche `task_mv44sfzi_00bg_6qazjl` ; auteur `pool-208`, session `ses_ecf10400affe6WDpBbKk3P4j46`.
- Modèle/variante : `openai/gpt-6-astra`, `medium`, selon attestation native du lead INPUT-ADMISSION-HARDENING-v1 ; égalité au routage persisté attestée, non recalculée ici. Cette attestation remplace la mention historique Sol high.
- Projection indépendante du lecteur factuel `ses_ed41fc6c0ffeWZh5hkKIUXKy89`, révision 2 ; aucune lecture de production sœur, C, review ou verdict.
- Sources effectivement lues : `inputs/ff8-decomp-semantics-20261011-r01/g17/0x509C80.readable/{manifest.json,asm-001.txt,asm-002.txt,bytes-001.txt,metadata.json}` et `inputs/ff8-decomp-semantics-20261011-r01/g17/common-compaction.md`. Ci-dessous A1/A2/B/M désignent respectivement les deux fichiers ASM, les bytes et les métadonnées dans ce répertoire.
- 30 instructions couvrant `[0x509C80,0x509CC3)`, bytes complets lus. B:1–3 confirme notamment les appels relatifs vers 0x509C10 et 0x505CB0, le JNB et les opérations partielles sur DL.
- SHA256 attestés parent, non recalculés : manifeste `f0b42bbb8338cdcc5e0640295bf7edbe92a1246a4c982092681e5281e21508a2` ; paquet original `2b5b3b9a757e4613d03a108e0bbbeccbba9a8ab8575582609814aa12d8792b32` ; compaction `f785a0931af7bb175c494b885cc51feab037139d05521e1686d110f79a2e671c`.
- Natif : x86 32 bits, FF8_EN.exe SHA256 `064d466b5fe2ba901fd44abf19f37c0fd6a2db40aabd95c9e5959195b6589570`, export 2026-10-11T16:38:25.140966+00:00 (M:4–9).

## Rôle et confiance
**CERTAIN, mécanique :** adaptateur conditionnel entre un objet et un état pointé. Pour un objet dont l'octet +4 est inférieur à 0x10, il obtient une valeur DWORD par 0x509C10(objet), puis charge le pointeur à objet+0x74. Selon l'octet +3 de cet état, il actualise cet octet ou appelle 0x505CB0 lorsque l'octet +0 ne correspond pas à la valeur calculée.

**UNCERTAIN, métier :** le contexte rattache cet objet à des enregistrements d'acteurs et suggère une synchronisation de leur état d'action/animation. Ni « script », ni animation, ni classe exacte de la valeur renvoyée ne sont démontrés par les deux helpers absents du gel. Les noms et commentaires historiques ne constituent pas une preuve.

## Entrées, sorties et effets
- Un pointeur DWORD sur la pile, à ESP d'entrée +4 ; convention compatible avec nettoyage par appelant. ESI est sauvegardé/restauré ; RET simple. Pas de validation de pointeur.
- Gate : lecture **non signée** de l'octet objet+4 ; pour les valeurs 0x10..0xFF, aucun helper, aucune écriture propre à cette fonction.
- Sinon, appel 0x509C10 avec l'objet. Le pointeur état = DWORD objet+0x74 est chargé **après** cet appel : ne pas supposer que le helper laisse cet emplacement inchangé.
- Soit `v` le DWORD EAX renvoyé et `b` l'octet état+0, zéro-étendu pour comparaison. Si état+3 était non nul, l'unique écriture locale est état+3 : zéro si `uint32(b)==v`, sinon l'octet bas de `v`. L'ancien octet +3 sert seulement de gate, pas de valeur conservée. Une différence avec `v` dont AL vaut zéro écrit donc aussi zéro.
- Si état+3 était nul : en cas d'égalité DWORD, aucune action supplémentaire ; sinon appel 0x505CB0(objet, v), avec le **DWORD complet** en second argument. Les deux slots sont nettoyés après l'appel.
- Aucune référence globale directe, boucle, index de tableau ou stride dans cette cible. Le stride 0x9C décrit dans la compaction:19 est un contexte d'acteurs voisin, pas une opération de cette fonction. Les offsets +0/+3 appartiennent au pointeur +0x74, pas directement à l'objet.
- Effets transitifs des deux helpers inconnus. Il serait incorrect de conclure à une fonction sans effet sur le domaine ou purement visuelle.
- **Retour AL/AX/EAX :** aucun retour uniforme établi. Le chemin gate conserve l'EAX entrant. Les chemins sans second appel laissent l'EAX complet du premier helper ; celui avec second appel laisse son EAX. Aucune instruction ne fabrique un booléen de retour. Le résultat calculé en EDX/DL n'est pas copié vers EAX. Signature `void` plausible, mais contrat des appelants non démontré.

## Nom proposé et verdict
`Object_SyncPointedStateIfByte4Below16` — **UNCERTAIN comme nom de domaine final**, mais descriptif mécanique défendable. Deux fondements indépendants : gate unsigned +4 (preuve 1) ; actualisation conditionnelle de l'état pointé et dispatch sur différence (preuves 3–5). Aucun ancien nom utilisé comme preuve. Ne pas promouvoir `TickScript` ni `ClassFromScriptBits` comme sens métier établi.

## Preuves natives
1. **Gate / unsigned :** 0x509C85–89, A1:3–4 : `cmp byte ptr [esi+4],10h ; jnb 509CC1`. Exclut aussi les octets 0x80..0xFF, contrairement à une comparaison signée.
2. **Ordre et indirection :** 0x509C8B–94, A1:5–8 : passage d'ESI à 0x509C10, puis `mov ecx,[esi+74h]`, nettoyage de quatre octets. M:104–107 et déplacement E8 dans B:1 corroborent la cible sans dépendre de son label.
3. **Deux modes :** 0x509C97–9C, A1:9–11 : test byte `[ecx+3]`, branche vers la comparaison sans écriture si zéro. Il ne s'agit pas d'un test sur l'octet +0.
4. **Écriture exacte / flags / largeur :** 0x509C9E–AB, A1:12–19 : EDX=0, DL=[ECX], SUB EDX,EAX puis NEG EDX ; le CF de NEG vaut 1 ssi la différence DWORD était non nulle. `sbb dl,dl` produit alors 0xFF ou 0 dans DL seulement ; `and edx,eax` fait de DL respectivement AL ou zéro, stocké en `[ecx+3]`. Les bits hauts d'EDX ne sont pas un masque booléen uniforme et ne doivent pas être présentés comme tel.
5. **Dispatch et paramètres complets :** 0x509CAF–BE, A1:21–25 et A2:1–3 : zéro-extension de l'octet +0 par XOR/MOV DL, comparaison à EAX entier ; appel 0x505CB0 uniquement sur différence, PUSH EAX puis PUSH ESI, nettoyage de huit octets.
6. **ABI et absence de résultat défini :** 0x509C80–81, 0x509CA0/AE et 0x509CC1–C2, A1:1–2,13,20 et A2:4–5 : restauration d'ESI dans les deux sorties ; RET sans immédiat ; absence de définition EAX sur le chemin gate. Aucun contrat BOOL/byte-return n'en découle.
7. **Xrefs bornées :** M:54–102 énumère huit références code, notamment 0x5025AB/0x502617 depuis 0x502380, 0x506797/0x506841 depuis 0x506690 et 0x50B75E depuis 0x50B2A0 ; 0xB3AA3B n'a pas de fonction contenante identifiée. Elles établissent des liens, non les prototypes ni la consommation du retour. La compaction:24,27 confirme des appels voisins sans prouver les sens métier des champs.

## Divergences, limites et questions ouvertes
- Pas de contradiction mécanique détectée entre ASM, bytes, CFG et compaction. Le commentaire historique A1:6 annonçant une conversion de bits en valeurs précises n'est pas vérifiable ici : ce n'est ni une preuve du domaine de `v`, ni une autorisation de le réduire à un octet.
- La compaction:26,38 signale l'absence des gels natifs 0x509C10 et 0x505CB0. Leur rôle, plage de retour, effets mémoire et convention complète restent ouverts.
- Quelle est la structure pointée à +0x74 ? Que représentent ses octets +0/+3 et le champ objet+4 ? Le stockage d'une valeur dans +3 exclut de présumer un simple booléen.
- Les appelants consomment-ils EAX, AX ou AL ? Leur ASM borné serait nécessaire pour établir un contrat de retour plutôt qu'une simple observation de registre.
- Validité des pointeurs, aliasing après helper et invariants runtime non prouvés. Aucun complément externe recherché.

Livrable indépendant déposé ; aucune validation finale, promotion, écriture IDB/git/registre ou action live.
