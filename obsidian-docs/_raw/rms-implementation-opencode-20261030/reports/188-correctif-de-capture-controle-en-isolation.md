# 188. Correctif de capture contrôlé en isolation

## Résultat et étape suivante

Le constructeur a corrigé le runner et le pin associé dans le plan, sans modifier le bootstrap ou les dépendances. Le parent a corroboré les nouvelles empreintes et contrôlé la syntaxe du runner : sortie0 en31ms, sans import.

Les dix contrôles ciblés des fonctions d'E/S passent en2ms dans un contexte JavaScript isolé. Ils utilisent des écritures simulées en mémoire : écritures complètes ou partielles, progrès invalide, borne du nombre d'appels, erreurs après préfixe, erreurs de flush/synchronisation/fermeture et de notification, redaction d'un secret réparti entre fragments, plafond de capture et nettoyage d'une sortie en erreur.

**Aucune application, base, requête HTTP ou processus enfant n'a été lancé.** Ces contrôles vérifient les primitives et leurs refus, pas la fermeture réelle d'un enfant ou le runtime Bun.

## Décision de revue

Le même reviewer indépendant reprend les deux défauts bloquants et les impacts du delta : containment des exceptions, résolution de l'attente de fin, ordre STOP/attente/reçu et absence de fausse attestation byteExact. Les preuves des API et des frontières non modifiées sont réutilisées. L'exécution du candidat reste interdite tant que les blocages ne sont pas levés et le contrat de qualification accepté par le parent.

Les risques IPC/argv Bun restent explicitement non qualifiés, sans élargissement de l'environnement sur hypothèse. Les chargements natifs ne seront pas déduits d'une réussite HTTP ou de logs vides.

## Preuves techniques

- [Résultats filtrés des contrôles isolés](../evidence/host-io-fix-isolated-checks-188.json).
- Runner corrigé :20993octets/SHA256 `5e612e34df6cee059e31cde665c6f050e60a75298a649f13c21d242b987fcb3c`.
- Plan corrigé :13968octets/SHA256 `b4b7af49c367e8cb53b2edc16f4cc77f11d7ee029f05d4854e09c4dce6c43e00`.
- Bootstrap inchangé :9522octets/SHA256 `56c5414107f41a6d3698e8a80920d9ac946dbd4f5c72ef8a164d7b79753a5602`.
- Reproduction de l'échec initial conservée au rapport187 et baseline intacte. Les anciens pins186 ne désignent plus le candidat courant.
- Réponse auteur `result_mvv32vdp_0000_07gbnz` : livraison corrigée uniquement, aucun test effectué par l'auteur, pas une acceptation.

Aucun nouveau modèle, session ou origine ; droits170 expirés et obligations D5/M2 inchangés.
