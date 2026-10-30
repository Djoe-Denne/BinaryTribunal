# 237. Première préparation native sans connexion OpenAI

## Décision et portée

Les corrections231/234/235 et l'enveloppe extérieure236 ont leurs avis indépendants favorables. Le parent engage le premier **Prepare seulement**, distinct de Connect. Cet acte peut déployer les deux scripts Auth épinglés, créer le seul dossier privé neuf avec ses droits Windows et acquérir un bail du contrôleur RMS. Il ne lance ni hôte Auth, fenêtre, OAuth, session ou modèle.

Le parent a relu la base RMS en lecture seule : le propriétaire est celui attendu, le fence courant est5, le parent immuable a le digest et sourceHash attendus, le root est révision3 avec une origine. Cette observation n'est pas une acquisition ; le script recontrôlera la préimage et le fence avant son acte atomique. Preuve `evidence/auth-prepare-preflight-237.json`.

## Commande fermée

Le parent vérifie les pins, puis appelle uniquement `auth-parent-236/observe-native-auth-phase-v1.ps1 -Phase Prepare`, avec l'intention neuve et le fence5 fixés dans `evidence/auth-prepare-intent-237.json`. Le pin extérieur exigé est37758697 ; les cibles Windows PowerShell60c9b298, lanceur74a3bf8b et deux MJS01fa1168/dcc9da26 restent épinglés. La connexion ne s'enchaîne pas automatiquement.

La garde du processus Prepare est30secondes, avec attentes/drains et opérations finales bornés, appel outil borné à45secondes. L'échéance240secondes commune sera créée par le marqueur natif ; elle ne sera pas renouvelée à Connect. Marqueur CreateNew avant effet, aucun retry automatique, overwrite, compensation ou réinitialisation de compte.

## Critères de réception avant toute suite

Exiger sortie native0, processus/image attribués, drains, pins après, résumé exact unique et hashes de l'acte et du provisoire rapprochés. Relire réellement le dossier vide, les ACL protégées avant/après, les deux déploiements et les preuves de bail. Schéma et données RMS doivent rester identiques hors les trois champs de bail ; root, origine, crédits, grants et identité parent inchangés. Une erreur bloque Prepare ; elle ne vaut pas connexion ou autorisation de recommencer.

Le reçu extérieur seul ne suffit pas : le superviseur doit observer la sortie0 de l'outil, l'absence d'invalidation et une échéance native encore courante. Si les critères sont satisfaits, Connect restera une action séparée, après lecture des preuves et information de l'utilisateur sur sa fenêtre privée. Il ne conférera pas de droit d'envoi de travail.

## Identité technique et état initial

Intention : `5312262b-f5f9-481f-ad40-29a12dcc9e6f`. Fence initial5, successeur attendu6. Fichier de binaire FF8 actuellement ouvert confirmé232 ; aucun accès supplémentaire à IDA dans cet acte.

Résultat non encore exécuté au moment de cette décision. M2 reste ouvert ; aucune origine de travail nouvelle n'est autorisée par cette préparation.

## Résultat natif reçu

Prepare a été exécuté séparément et reçu : sortie outil0, résumé unique NATIVE_AUTH_PHASE_OBSERVED, reçu extérieur SHA256 `1a56f4f4022840c08d2bcde0bacdb0d1a70e2470bfc6846bc6639558305a62e6`. Processus PowerShell46048 et Bun40516 attribués ; durée extérieure1263ms,982,3988ms depuis le marqueur Prepare à la réception native.

Le parent a relu l'acte et les snapshots : fence5→6, propriétaire attendu, digests des tables hors les trois champs de bail inchangés. Une lecture native supplémentaire des ACL confirme protection, propriétaire courant, exactement les trois SID autorisés avec FullControl et héritage OI/CI, sans règle héritée inattendue ; le dossier est réellement vide. Pas de connexion ou de nouvelle origine pendant Prepare.

À l'acceptation parent, il restait215226ms dans l'échéance originale. La préparation est reçue dans sa portée, pas comme succès Auth. Sources : `auth-parent-236/prepare-5312262b-f5f9-481f-ad40-29a12dcc9e6f-FINALOUTCOME.json`, son marqueur et `auth-parent-231/attempt-5312262b-f5f9-481f-ad40-29a12dcc9e6f/{controller-act,before-prepare,after-prepare,acl-before,acl-prepare-after}.json`.
