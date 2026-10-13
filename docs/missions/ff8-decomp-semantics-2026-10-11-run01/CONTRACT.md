# FF8 decomp/semantics — run01

GO utilisateur reçu le 2026-10-11 dans la session superviseur.

Steering utilisateur antérieur — diversification / pool : **40 agents actifs utiles au total = 1 lead + 39 workers**, supersède le plafond provisoire25 ci-dessous. Supervision et départs par lead, pas de dispatcher/veille30s. Autorisation explicite de diversifier OpenAI, OpenCode Go GLM, ZAI GLM et Cursor Grok4.6. Catalogue natif vérifié : `opencode-go/glm-5.3-flash` max/high ; `zai-coding-plan/glm-5.3-flash` max/high ; `cursor/grok-4.6` variante exacte `Grok 4.6 High`. Ne pas substituer Grok4.7 silencieusement. Préférence OpenAI complexe maintenue, pas exclusivité ; pas de nouveau Console payant. Réadmission ZAI bornée après429 temporaire, jamais boucle de retries ni saturation globale supposée. Model.Ref effectif exact obligatoire avant extension des admissions. Exception VM0x487DF0 et toutes gates/forks aveugles inchangées.

## Avenant 2026-10-12 — référence de contrôle des modèles

Correction autorisée par l'utilisateur après audit des alertes pool-79/pool-99.
Elle s'applique uniquement à `ff8-decomp-semantics-20261011-r01`
(`team_mv41qy6o_0000_vbge32`) et supersède les comparaisons aux choix statiques
historiques ci-dessous.

- Pour une admission automatique, vérifier le `Model.Ref` natif (provider, ID
  **et variante**) contre `model_routing.selected` persisté **au départ**. Un
  override explicite de lancement reste prioritaire : utiliser alors le modèle
  et la variante persistés avec cet override. Ne pas recalculer l'attendu avec
  une politique modifiée depuis l'admission.
- Les modèles des manifests v1 et les fragments de tâches générés sous les
  anciennes politiques (« Pool25 », « Astra high », etc.) sont des attentes
  historiques, pas des overrides natifs. **Désactiver le comparateur bloquant
  contre ces seules attentes et sa réaction pause-autoscaling/arrêt-worker.**
  Un tel écart est informatif et ne justifie ni arrêt ni rejet de production.
- Tracer la décision et la révision de politique d'admission. Le modèle de la
  session source d'un fork/checkpoint n'est pas l'attendu du nouvel auteur :
  contexte hérité et choix du modèle sont deux décisions distinctes. Une preuve
  d'admission absente reste à établir ; ne pas déclarer la conformité par défaut.
- Une divergence réelle entre référence native et décision d'admission, une
  erreur transport, une contrainte utilisateur exacte encore applicable
  (notamment l'exception VM `0x487DF0`), ou une entrée/provenance invalide reste
  une erreur explicite. Les erreurs de chemins/permissions et les gates
  d'indépendance/contexte doivent être traitées séparément ; aucune promotion
  rétroactive sur la seule conformité du modèle.
- **Aucun GO de reprise** : l'ordre utilisateur DRAIN du 2026-10-12 à 13:45 UTC
  reste en vigueur. Laisser finir les agents en cours ; cette correction ne
  réactive ni `auto_scale` ni `auto_dispatch` et n'autorise aucune admission.

## Périmètre et autorité

- 98 EA du brief `../ff8-decomp-semantics-2026-10-11.md`, sections 1–2 uniquement.
- Extension de 151 EA exclue ; aucun live. Historique DRAINED / STOP_DISPATCH inchangé.
- Nouvelle équipe `ff8-decomp-semantics-20261011-r01`, nouveaux IDs et ledger append-only `ledger.jsonl`.
- Aucun plafond de coût ou concurrence utilisateur ; maximiser les admissions utiles, sans doublon ni saut de dépendance. Saturation attestée : route temporairement indisponible, cause/Retry-After/cooldown tracés ; autres routes maintenues.
- Superviseur seul : ledger canonique, validation ASM §5.6, IDB/save/readback et Git sérialisés. Classification/routage préparatoire déléguables à des workers dédiés après steering utilisateur ; ceux-ci écrivent uniquement leurs propres receipts brutes et demandes d'attribution dans `outputs/`, jamais le ledger canonique. Le lead possède la création des sessions et l'admission finale. Workers : pas de mutation IDB/Git/registre/live, pas de délégation.
- Travail utilisateur préexistant préservé ; aucun commit global opportuniste.

## Contexte et classification obligatoires

1. Export natif factuel, regroupement par graphe d'appels IDA ; chaque EA appartient à un groupe unique.
2. Explorateur lecteur par groupe, contexte de découverte sans reconstruction/verdict cible.
3. Une compaction factuelle commune gelée/versionnée/hashée par groupe.
4. Pour chaque EA : `classify_x86` reçoit son ASM complet et cette compaction commune. Archiver le payload exact avant appel et la réponse native complète à réception, sans enrichissement a posteriori. Exception utilisateur explicite après GO : entrée dépassant les limites de Classify → évaluation par `openai/gpt-6-luna-fast`, variante `medium`, même ASM complet + compaction, prompt/scoring/réponse exacts archivés avec `classifier_kind=luna_oversize` ; ne jamais présenter cette évaluation comme une sortie native Classify. Aucun tronquage. Autres erreurs ou capture manquante : bloquer cette EA, continuer les autres.
5. Productions C et sémantique en parallèle, forks indépendants depuis la même session explorateur gelée, explicitement autorisés par l'utilisateur. Pas d'héritage des productions des frères ni du lead. Slots recyclables, auteurs C nouveaux par fonction/production.
6. Réconciliation distincte après dépôt A+B ; contrôle final croisé C/sémantique par le superviseur.

Flux événementiel par groupe : dès la découverte terminée, lancer classification/routage puis les auteurs admissibles, sans attendre les autres découvertes. L'agent de classification n'est jamais la source des forks auteurs ; conserver la source explorateur factuelle. Réutiliser les appels déjà archivés, sans double appel inutile.

Le steering temporaire « courrier uniquement / reasoning low » a été retiré explicitement par l'utilisateur avant tout changement natif de modèle. Classification/routage borné restauré, sans redécouverte inutile ; préserver les travaux déjà terminés et ne pas rappeler Classify quand une réponse complète existe.

Steering utilisateur pool/coût : plafond provisoire **25 agents actifs utiles au total, lead inclus (24 workers)**. Remplace le GO précédent sans plafond de concurrence pour cette mission seulement. Les sessions déjà en vol au moment du changement sont drainées sans interruption ; aucun nouveau départ si 24 workers sont déjà actifs. Sessions idle/failed et tâches en attente ne consomment pas un slot actif. Recharger les slots libérés uniquement sur dépendances satisfaites et gates d'admission ; jamais compter une réservation comme travail actif.

Privilégier **OpenAI** pour les tâches de haut niveau/complexes : nouvelles productions C complexes A=Astra high, B=Sol high en sessions indépendantes ; sémantique et R=Sol high. Les propositions Opus/OpenCode Console des manifests v1 restent historiques ; ne plus les appliquer aux nouveaux départs, car Console est payé à l'usage. C medium garde Sol high (substitut temporaire GLM indisponible) + Luna medium via OpenCode Go, distinct de Console. Pas de changement global/config ni de migration des sessions déjà lancées. L'exception utilisateur 0x487DF0 demeure GLM max dédié 2+1 ; cette préférence ne l'annule pas. La file supplémentaire demeure dans les 98 EA autorisées, sans extension aux 151 EA exclus.

## Routage initial conservateur v1

Les seuils sont des décisions opérationnelles du superviseur après GO, non une calibration démontrée.

- Simple : complexité ≤25, risque ≤20, ≤80 instructions natives ; aucune ambiguïté ABI/arithmétique, contrôle indirect non résolu, contexte incomplet ou contradiction. Un auteur par volet + validation parent. Tout obstacle entraîne 2+1.
- Moyen : hors simple, complexité ≤65 et risque ≤50, sans trigger structurel majeur ; 2+1 par volet.
- Complexe/haut risque : autres cas, >200 instructions, contrôle indirect non résolu ou conflit ; 2+1 par volet.
- Classification obligatoire et consultative : ne dispense jamais des contrôles natifs ; motifs de surclassement tracés.
- Catalogue partagé `C:/Users/djden/.config/opencode/ensemble.json`, snapshot exact local sans override global. Modèles/variantes découverts, `Model.Ref` effectif vérifié à chaque création. Écarts de variantes bloqués ou mapping explicite tracé, jamais default silencieux.
- Lecture : route gratuite vérifiée si suffisante, sinon Luna medium/GLM high. C simple : MiMo Flash/Luna ; C moyen : GLM max et Luna medium indépendants ; C complexe : Astra high et Opus high indépendants. Sémantique : Sol medium/high selon risque, seconde production indépendante si 2+1 ; R high, escalade motivée possible. Alternatives du catalogue admissibles selon disponibilité et risque, justification obligatoire.
- Refus/auth/entrée/erreur C ne sont pas assimilés à saturation. Reprise événementielle bornée ; aucune boucle de polling ni action d'alimentation/service/configuration globale.
- Instruction utilisateur après GO : `0x487DF0` (2447 instructions, ASM natif 140198 caractères) → sessions GLM 5.3 Flash dédiées, `zai-coding-plan/glm-5.3-flash`, `max`, 2+1 par volet. L'annonce utilisateur de contexte 1M n'est pas une mesure de capacité effective ; vérifier admission et couverture complète, sans réduire le gel. Le routage Luna oversize concerne l'évaluation, pas cette production.
- Steering exploration : privilégier intelligence déclarée moyenne ou supérieure ; GLM Flash max (42) et Sol medium/high (48) pour les nouvelles découvertes. Luna medium (30) n'est plus une route privilégiée de découverte ; contrôler la compaction g02 déjà produite contre le gel natif. Luna Fast medium reste autorisé pour l'évaluation oversize. MiMo Console et OpenCode Go sont des accès distincts ; le 403 de la seule tentative `opencode/mimo-v2.6-flash-free` n'est ni une saturation ni une preuve d'indisponibilité générale de Console.

## Activation et clôture

Vérifier accès IDA, 98 EA uniques, extension 151 distinctes et disjointe, catalogue, communication, Model.Ref, capture Classify et fork avant élargissement aux producteurs. Un blocage de production n'interdit pas une découverte indépendante utile.

Clôture par EA seulement après couverture native complète, preuves C/sémantiques, §5.6 et traces de validation ; défaut non résolu reste UNCERTAIN/CONFLICT, jamais promotion sur prose seule.
