# Parent QA1 — P1–P7 tranchés, corrections de plan puis GO source

Plan result_mvdzsw8a_0026_t56hi4 lu ; 15pins215401B exacts, golden862B décodé
indépendamment par QA, pas implémentation auteur vue. Model.Ref Flash/max vérifié.
Ce n'est pas une livraison/source acceptée. GO écriture trois outputs seulement
après lecture/correction ci-dessous et du supplément API_R3 commun (hashes au
MANIFEST,15pins initiaux intacts). Aucune compilation/exécution produit worker.

P1–P6 CONFIRMÉS comme proposés : argv0 mismatch6 ; entry nonallowlistée9 ;
nulls code du step ; getters lists triées ; argvrawvalide/encodedcmdtropgrand7 ;
entriesrawvalides/blocdérivétropgrand10 avant cap15. Chaque négatif doit réellement
passer ses guards antérieurs. P7 CONFIRMÉ OrdinalIgnoreCase membership, casing
des chaînes/record conservé, pas hash invariant à casse. Voir API_R3.

Corrections obligatoires et périmètre :
1. PAS de nouvelle implémentation SHA256 embarquée. Utiliser la bibliothèque
   .NET4 standard `System.Security.Cryptography.SHA256Managed` (ComputeHash sur
   byte[]), mémoire seule, dispose déterministe. Aucune dépendance/package ou
   algorithme crypto maison supplémentaire. Le golden/hash littéral reste
   indépendant du codec produit, bibliothèque standard n'est pas une faiblesse
   d'indépendance. Ne pas exécuter cette nouvelle source pendant l'écriture.
2. Cmdline golden =30 UTF16units, pas29 : image12 +3séparateurs + videquoté2 +
   x-y-espacequoté5 + b-backslash-quote-c quoté8 =30. Transcrire les caractères
   exacts depuis règles/vecteurs QA0, pas changer la chaîne pour valider29.
3. Helper TryCountControlFiles : il compte les arrays reçus seulement. Sans
   record explicite31907 est encore <=32768 et donc accepté ; pas de seuil
   implicite31906. Tester totaux réels32767/32768/32769. Si besoin tester un
   ensemble record862+artifacts31907, fournir les deux et nommer le total32769.
4. T08 padding recette correcte : recordlen862 + firstThree40 + payload31865/
   31866/31867 =32767/32768/32769. Table fourth length offset826, sha offset830.
   Nouvelles valeurs de hash/table, pas égalité avec le record baseline entier.
5. Long image ASCII259, cwd/autres champs inchangés, modifie TROIS occurrences
   targetImagePath/argv0/SourcePin.PathLabel. Delta3*(259-12)=741 ⇒ record1603,
   contrôle1659 (56bytes additionnels), PAS1348. Fixture coordonnée : par exemple
   `C:\d\` +250fois`x` +`.exe` =259 ; imagepinlabel identique, sha/bytes cohérents.
   Validité data syntaxique seulement, aucun chemin réel/file/OS prouvé.
6. Les tailles944/947 nécessitent des labels explicites : ajouter à la baseline
   un sourcepin label `p2` (2chars) ajoute82B ⇒944 ; label `empty` (5chars),Bytes0,
   SHA256empty ajoute85B ⇒947. Si un autre label est choisi, dériver sa vraie
   longueur au lieu de garder l'entier. SHAidentique souslabeldistinct permis.
7. Le golden complet bytes/intent est l'oracle de BASELINE, pas de tout positif
   modifié. Pour autre fixture, attendu indépendant de la recette ou assertions
   ciblées clairement limitées ; self-roundtrip seul n'est pas oracle intégral.
8. Ajouter TryEncodeCanonical(null) false/canonicalnull/refusalnonzero sans
   imposer un enum nonfixé. Réflexion/forgingCaseIdentity interdits ; tests du
   ctor gelé restent préconditions ABI, pas nouvelle couverture du DTO.
9. Rapport Console ASCII cap1024 inclut newline/summary/truncationtag et toutes
   branches ; réserver place du tag avant consommation. Pas stackalloc/unsafe/
   lecture fichier/OS/process/clock/env/DB/réseau. Helpers de tests simples, pas
   framework/logging nonborné. Console seulement lors du futur gate parent.

API_R2 -r déjà reçue : TryBuild refuse nu ETpréfixe-r= ; ajouter positif-rmodule
sur domaine contractuel, primitivesquotent cesstringssanspolitiqueTryBuild. Aucun
code auteur remis. U7 document absent reste déclaration, aucune recherche origin.
Rendu final NATIF sourceproposée+hashs/tailles/15pins et suppléments/ancres/limites,
pas teamtools/claim/complete. FreshV composé puis parentcompile/run gates séparées.
