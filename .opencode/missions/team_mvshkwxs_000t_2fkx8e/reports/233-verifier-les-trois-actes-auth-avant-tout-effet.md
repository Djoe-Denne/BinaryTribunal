# 233. Vérifier les trois actes Auth avant tout effet

## État reçu

Les trois candidats231 sont livrés et gelés. Le parent a recalculé leurs tailles et empreintes : concordantes. Ils ne sont encore ni exécutés ni acceptés. Produit226, interface225, anciens scripts193/219 et bases restent hors de ce delta.

Une revue indépendante des nouvelles frontières est engagée : création exclusive et droits Windows, séparation Prepare/Connect, continuité et bail, délai total depuis Prepare, raccord privé à l'enfant réel, projection sans secrets, réception exacte et conservation du journal même après échec. Ce n'est pas une nouvelle étude des acquis ou une revue finale M2.

## Contrôles fermés sans exécution

Le parent autorise uniquement :

- `node --check auth-parent-231/prepare-auth-controller-v1.mjs` ;
- `node --check auth-parent-231/receive-auth-parent-v1.mjs` ;
- Parser.ParseFile PowerShell sur `auth-parent-native-v1.ps1`, sans invocation ou dot-source.

Les commandes et résultats seront conservés dans `qa-auth-parent-233`, avec les trois pins avant/après et le pin du PowerShell Windows fixe pour le futur lancement. Attendus : sortie0 pour chaque vérification Node, zéro erreur PowerShell, attentes natives explicitement bornées. Aucun script candidat évalué ou importé. Aucun déploiement, dossier Auth, changement d'ACL ou de bail, base réelle, UI ou connexion pendant cette QA.

Les QA produit226 et interface230 sont réutilisées dans leur portée ; le typecheck du harness inchangé ne vérifierait pas ces scripts extérieurs et n'est donc pas rejoué artificiellement. Leurs comportements natifs restent non prouvés par la seule syntaxe. Les contrôles d'exécution futurs seront fermés après inspection et revue, sans suite globale, diagnostic gelé ou privilège supplémentaire.

## Localisation, impact et limites

- PowerShell :254lignes, création/readback des droits50–120, budget121–132, lancement borné134–168, phases169–253.
- Préparation Bun :148lignes, main99–143 ; import Store seulement dans cet acte, export sans ouverture de base. Métadonnées168/205 relues par le parent : mission, contrôleur, principal, acteur et mandat concordent. Il s'agit de fichiers historiques non secrets, pas d'une preuve de contrôleur encore courant.
- Récepteur :274lignes, schémas publics fermés, journal avant/après et audit final. Les effets réels et les preuves Windows n'ont pas été exécutés par l'auteur.
- La première tentative de script d'inventaire parent a échoué sur une expression régulière avant évaluation. L'appel a été corrigé avec des comparaisons textuelles simples ; pas de panne MCP ou exécution candidate déduite de cette erreur.

Serena reste rattaché à retro-eng ; le produit temporaire est hors couverture canonique et les actes sous le dossier mission sont des fichiers ponctuels. Les sources exactes et leurs pins font foi ; aucune reconfiguration du serveur.

## Pins

- `auth-parent-native-v1.ps1` :20392octets, `9a3b1901e26f86db5b49305dad518efc29e130bcf7fb2c6f83434405fc8f9828`.
- `prepare-auth-controller-v1.mjs` :14074octets, `01fa116885f974bc5592c6e47edcd05578a35c30fa0cb84fbfad1d5cb53c4e95`.
- `receive-auth-parent-v1.mjs` :31165octets, `dcc9da265ef5174f90352153255b4424b24a7344e5497ceaafabe00bb963452c`.

La vraie connexion OpenAI, le travail IDA et M2 restent ouverts. La disponibilité actuelle du connecteur IDA232 n'est pas révoquée et ne déclenche aucune campagne scientifique.

## Résultats réels : deux syntaxes réussies, lanceur refusé

Node --check réussit pour prepare en33ms et receiver en29ms. Le parseur PowerShell retourne24erreurs en8ms ; aucune évaluation ou invocation. Les trois pins avant/après concordent. Reçu conservé dans `qa-auth-parent-233/syntax-only.json`. Les cinq attentes détectées portent un argument explicite, mais cette observation ne compense pas les erreurs de syntaxe.

Le diagnostic ciblé identifie des continuations d'expressions avec -and en début de ligne, notamment47,78–80,123–124,159 et164, qui produisent des erreurs en cascade dans le parseur Windows utilisé. Le gel PS n'est pas recevable et aucune phase Prepare/Connect ne peut être lancée. Les deux résultats JavaScript restent valides pour leurs octets inchangés ; aucun PASS global des actes parent.
