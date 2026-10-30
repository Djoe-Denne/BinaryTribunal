# 1. Réaliser RMS sans refaire la documentation — contrat proposé

## Objectif et état

Rendre utilisable le parcours faits gelés → graphe → groupes → plan → sessions → revue/réconciliation → connaissance durable → prochain travail. La documentation acceptée reste une entrée, pas un chantier à refaire.

Exécution suspendue. Aucun worker, classificateur, test produit, worktree ou tâche native lancé par cette préparation. Seuls le brouillon local de politique et ce rapport sont écrits.

## Politique proposée, non approuvée

Le contexte de reprise demande OpenAI exclusivement, une autonomie de bout en bout et une vérification renforcée. Le brouillon reçu était multi-fournisseur, sans autonomie explicite et avec une vérification proportionnée. Le nouveau brouillon corrige ces écarts, sans les rendre actifs.

- Fournisseur unique OpenAI, modèle `openai/gpt-6.1-sol`, variantes low, medium, high, xhigh. Même session et modèle par tâche ; effort ajustable dans la grille approuvée.
- Seuil de planification conservé à 50 ; démarrage planifié proposé en high, désormais non réservé. Pas de classificateur ni de score de difficulté.
- Repères catalogue hérités (intelligence / coût indicatif par tâche) : low 42 / 0,13 ; medium 48 / 0,21 ; high 50 / 0,32 ; xhigh 51 / 0,39. Ni devis ni plafond de dépense. Disponibilité native et Model.Ref effectif restent à vérifier. Aucun repli hors OpenAI.
- Autonomie long run proposée : suivre le plan accepté jusqu'au bilan, préserver les preuves valides, décider et tracer les choix courants et ratifications nécessaires sans GO intermédiaire. Aucun contournement de permission ou d'arrêt ; architecture hors mandat et infrastructure importante à arbitrer.
- Vérification **reinforced**, obligatoire selon M2 §7.1 et le contexte. Light (contrôles ciblés seuls) ou proportionate (contrôles selon risques) ne peuvent remplacer silencieusement cette exigence. Pas de chaîne fixe d'agents : seule la revue finale indépendante requise est prévue.

Le fichier `model-policy.json` contient les commandes, critères et priorités exacts. L'utilisateur doit afficher la nouvelle révision par `/ensemble-mission config` avant `/ensemble-mission start`. L'empreinte du brouillon reçu ne couvre plus le brouillon corrigé.

## Aperçu borné des travaux — pas de file native publiée

1. **Préserver et transférer la base exacte.** Superviseur/intégrateur ; préalable à tous les writers. Produire copie possédée, manifeste, correspondance de chemins et journal unique des obligations acquises/affectées/manquantes/bloquées. Reprendre composition, exception codec, sources176, quatre fichiers source113 protégés, extras, contrôles et dix entrées. Arrêt sur pin inexpliqué ou entrée indispensable absente.
2. **Décider le correctif de remplacement sur les preuves existantes.** Après la base, reprendre D3 sans refaire l'étude générale ni relancer la mesure gelée. Livrer un delta local justifié ou la question discriminante bloquée par un droit manquant. Ne promettre aucun gain. Propriétaire exclusif des modules génération/remplacement/activation.
3. **Raccorder préparation, moteur et interface publique.** Après la base, en parallèle du remplacement seulement si écritures disjointes. Le superviseur ratifie jonction v2/v3 et contrats admission/body/observation avant réalisation. Établir source/version autorisées du handler sans contourner le refus antérieur. Prouver les identités, permissions et observations nécessaires ; une simulation n'est pas une preuve native.
4. **Fermer les écarts de persistance et activation affectés.** Après la décision de remplacement, avec le même propriétaire pour les fichiers communs. Delta minimal et tests d'impact ; préserver transitions atomiques, révocation, rollback et absence de double effet. Ne pas réécrire les primitives déjà qualifiées.
5. **Relier publication et contexte suivant.** Après les interfaces ratifiées et résultats retenus. Même propriétaire ou passage sériel pour graph-engine/store/adapter, communs au raccordement. Prouver publication unique, relecture exacte et reprise, puis acquisition des nouveaux contenus dans une projection versionnée, sans modifier le contexte gelé.
6. **Vérifier, revoir indépendamment et intégrer.** Réutiliser D5 et les oracles L7. Déclarer le contexte fresh de la revue indépendante finale avant son admission. Le superviseur intègre, consolide les preuves et accepte ou rend les blocages précis. Reprises sur défauts bloquants et impacts, pas sur suggestions différables.

Un seul lead, équipe actuelle réutilisée après approbation, aucune ancienne file réactivée. Concurrence utile selon dépendances et fichiers disjoints, sans quota artificiel. Aucun spécialiste RE utilisé comme testeur RMS générique.

## Vérification fermée et conséquences des arrêts

Depuis le harness du candidat exact : `bun run typecheck`, `bun run test:q1-primitives` et `bun test` restent les références consolidées. Avant commande : version, sélection, oracle, droits, ressources possédées, impact et arrêt vérifiés. Quinze secondes par test ; aucune hausse implicite. Une commande globale atteignant un chemin interdit demeure interdite ; un filtre ne prouve jamais la suite complète.

Les critères du brouillon couvrent le transfert complet ; remplacement/activation sûrs ; jonction runtime/public ; publication et nouveau contexte ; scénario final D5 ; revue indépendante et validation parent ; clôture M2 §8. Chaque obligation a une preuve pertinente, distincte lorsque le risque l'exige. Les preuves existantes sont réutilisées dans leur portée ; changement de session seul ≠ invalidation.

Le scénario final relie admission ambiguë/réponse perdue, retry sans deuxième effet, terminaison prouvée et résultats tardifs, revue/réconciliation, publication unique et relecture exacte, replay et travail suivant alimenté par les nouveaux contenus. Les observations natives OpenCode ne sont pas du live FF8, mais exigent leurs droits propres et ne sont pas réputées acquises.

Blocages conservés :

- Délai de remplacement : dernier résultat documentaire FAIL, environ 111 secondes contre quinze ; gain et cause racine non démontrés. Aucun nouveau diagnostic, mesure ou instrumentation libéré par ce plan.
- Trois chemins threads HOLD125 : interdiction entière ; timeout ou terminaison d'un worker ne prouve pas l'absence de processus orphelin.
- Origines : bootstrap + OLD + deux NEW distincts en demandent quatre sous plafond trois. Pas de reset, autre racine ou réutilisation du même NEW comme substitut.
- Accès externe : source déployée et événements du handler non établis ; refus antérieur non contournable.

Continuer les chantiers indépendants autorisés. Une preuve obligatoire bloquée interdit toutefois la clôture complète : livrer un bilan partiel/bloqué, pas un faux succès. Aucun SKIP compté PASS ni oracle affaibli. Les droits et arrêts ne sont pas levés par un start générique.

Toujours exclus : C#, jeu/processus cible, IDA/live FF8, run01, G5–G7, exécution du code reconstruit, configuration globale, achat/repli payant implicite, nettoyage des autres travaux et dépendance globale au helper Windows.

## Décision proposée

Recommandation : **OpenAI seulement + long run borné + vérification renforcée**, puis `/ensemble-mission config` pour afficher la révision exacte. Si elle convient, l'utilisateur pourra lancer `/ensemble-mission start` : travaux et tests admissibles seulement, sans levée des arrêts.

Les corrections en conversation laissent la mission suspendue jusqu'à nouvel affichage et approbation. Différer conserve le code et les obstacles actuels. Une QA moins exigeante ou une levée d'arrêt obligatoire demande un arbitrage explicite ; ce n'est pas une simple variante de ce contrat. Aucun coût total ou délai fiable établi à ce stade.

## Références et portée des observations

- `docs/missions/rms-static-realisation-20261028/CONTEXTE.md` §§4–8, `PROMPT_REPRISE.md`, `BASELINE.json`.
- D1, D5 et D6 §§3–8, sous `docs/missions/re-graph-scheduler/rms-static-documentation-20261028/` : preuves/versions, oracles, scénario final, fiches et critères acceptés.
- Ordre M2 amendé : `docs/missions/re-graph-scheduler/ORDRE_MISSION_02_REPRISE_RMS_APRES_M1_20261020.md` §§7.1 et 8 ; guide `docs/tech/RE_MULTI_PROVIDER_MISSIONS.md` ; skill `opencode-ensemble` et sa référence mission-policy.
- BASELINE rapporte 47/47 pins S1, 308/309 lignes de composition avec exception codec connue et 14/14 sources176 : résultats historiques de comparaison d'octets, non revalidés ici, non tests produit.
- Localisation : lectures des fichiers documentaires connus, directement et via Context Mode. Impact : brouillon de mission et présent rapport seulement. Limites : aucun symbole produit modifié, exploration symbolique non nécessaire, aucune qualification logicielle ou preuve native nouvelle.
