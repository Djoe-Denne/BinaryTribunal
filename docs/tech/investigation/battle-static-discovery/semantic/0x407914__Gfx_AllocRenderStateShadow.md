# 0x407914 — Gfx_AllocRenderStateShadow

- **Statut parent** : §5.6 live vérifié ; push append-only effectué, tag relu ; `save_database` a retourné `true`.
- **Verdict V** : ACCEPTE ; **confiance** : CERTAIN pour le rôle et le corps ; **nom confirmé** : `Gfx_AllocRenderStateShadow`, aucun renommage proposé.
- **Mode** : 1+V Sol, analyse A et revue V en contextes séparés ; C-A/C-B indépendants Sol, puis réconciliation ASM. Aucun autre modèle revendiqué.
- **Sources** : `tools/_tmp_semantic_triple/0x407914/semantic_a_sol.md` et `semantic_v_sol.md` ; C documenté par la copie fidèle de `decomp.md` dans `../decomp/0x407914__Gfx_AllocRenderStateShadow.md`.
- **Couverture rapportée par A/V** : 108/108 instructions, neuf blocs CFG, 393/393 octets (`0x189`), un chunk `[0x407914,0x407A9D)` ; SHA256 octets IDB `8fe6eacd75fe712d2673fd00769cd6512a6bd2932ed2dfff48aab66cdf027645`.
- **Validation parent** : couverture/chunks, neuf appels et cleanups, caller et publication, masque, branches signées, strides DWORD et retour EAX vérifiés live. Commentaire utilisateur conservé, ajout `[semantic-triple 2026-10-08]` par `set_func_cmt`, sauvegarde vérifiée après ce push.

## Rôle, contrat et effets

Construit un nouveau bloc logiciel shadow des états de rendu de `0x154` octets, ses deux tables de résultats et ses objets auxiliaires ; ne réinitialise pas un bloc existant et ne garantit pas un commit GPU immédiat. Le nom est redérivé de l'allocation, de l'installation par le caller et du consommateur live, pas de l'étiquette IDA. V accepte A sans désaccord ni correction sémantique ou C.

Un argument cdecl de 32 bits à `[EBP+8]`, transmis comme contexte ; RET simple. EAX retourne le pointeur/DWORD complet de l'allocation initiale, ou zéro si le wrapper retourne zéro : ni booléen ni AL. Le wrapper `assert_calloc` reste interne, non remplacé par libc ; son remplissage zéro est vérifié dans A/V, non déduit de son nom. La cible ne publie pas le bloc : son unique caller direct observé, `sub_408E90`, le range à `ctx+0xA84`.

Deux descripteurs locaux de `0x84` octets sont initialisés. La boucle parcourt 26 états/indices, avec le masque `0x0385FF7D` et 19 positions sélectionnées : `{0,2,3,4,5,6,8,9,10,11,12,13,14,15,16,18,23,24,25}`. Les sept positions `{1,7,17,19,20,21,22}` sont sautées et restent initialement zéro grâce au wrapper. Le test de borne JGE est signé ; le SHL commun aux branches précède l'incrément suivant.

Pour chaque position sélectionnée, deux objets sont obtenus avant les écritures DWORD : A+8=A+0xC=bit, B+8=0 et B+0xC=bit, sans garde NULL. Deux appels `sub_41E1AF(0,objet,0,&desc_A,ctx)` précèdent les stores de leurs résultats dans deux tables de 26 DWORD à `+0x7C/+0xE4`, stride 4, derniers offsets `+0xE0/+0x148`. Ces helpers peuvent modifier les objets : les stores locaux ne garantissent pas leur état final.

Enfin, `sub_4074F7(0|1,&desc_B,ctx)` fournit les résultats à `+0x14C/+0x150`, le premier étant stocké avant le second appel. Trois slots et cleanup de 12 octets sont attestés aux call-sites ; le corps entier de ce helper ne lit pas le troisième slot. Aucun enum d'état, layout métier des descripteurs ou propriété des objets n'est déduit.

## Preuves sélectionnées de V (6)

1. **Allocation et nom — `0x407935`.** L'appel au wrapper reçoit `(1,0x154,source,0x251)` ; il construit un bloc neuf, pas une remise à zéro d'un bloc existant.
2. **Publication caller — `0x408EBC`.** Le résultat est écrit dans `[ctx+0xA84]`, après l'unique xref direct observé ; cette publication n'appartient pas au corps cible.
3. **Consommateur logiciel — `0x4385B8`.** Le bloc chargé via `ctx+0xA84` reçoit un DWORD indexé par type, dans un accesseur sans CALL : confirmation indépendante du shadow logiciel.
4. **Masque — `0x40791D`.** Chargement de `0x0385FF7D` ; V recalcule indépendamment 19 positions sur 26, avec sept positions absentes et SHL commun.
5. **Stride — `0x407A1E`.** Store DWORD à `[bloc+i*4+0x7C]` ; V confirme aussi la seconde table à `+0xE4`, toutes deux de 26 emplacements.
6. **Retour — `0x407A96`.** `mov eax,[ebp-4]` restitue le DWORD de l'allocation originale, zéro inclus, indépendamment des résultats auxiliaires.

## Réconciliation C et limites

C-A/C-B indépendants Sol ont été réconciliés sur l'ASM et les octets IDB. Hex-Rays a ensuite été recoupé : ses arguments fantômes `v4/v5` aux appels sans arguments `Render_sub_4070E2` sont supprimés, le troisième slot des appels finaux est conservé, le SHL est représenté unsigned et le buffer B fait `0x84` octets, pas un octet. Strides, ordre appels/stores, absence de gardes et retour intégral sont préservés. V ne demande aucune correction ; aucune compilation ni équivalence exécutable n'est revendiquée.

Seule l'allocation externe est testée contre NULL. Les objets intermédiaires NULL ne sont pas gardés avant déréférencement et peuvent provoquer une faute. Les échecs auxiliaires ne sont ni testés ni propagés en échec global : un bloc non NULL peut contenir des résultats NULL. Aucun free/rollback local ; cela n'exclut pas les nettoyages internes des helpers.

Aucune garde locale du contexte ; le caller observé exclut seulement ctx NULL, pas une adresse invalide. Ownership, durée de vie, enums et effets exacts des callbacks restent non établis. Des appels backend indirects interdisent de garantir l'absence d'effets GPU ; aucun commit GPU immédiat n'est démontré.

Neuf CALL et cinq destinations du corps sont couverts ; le callgraph brut `TRUNCATED` ne prouve pas un graphe supérieur complet ni une récursion. Gros helpers examinés aux fenêtres citées, pas exhaustivement ; pas de vérification PE/processus ni de test d'exécution revendiqué.
