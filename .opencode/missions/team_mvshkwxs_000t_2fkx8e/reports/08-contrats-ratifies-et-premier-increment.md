# 8. Contrats ratifiés pour un raccord versionné, sans activation native implicite

## Objectif et décision

Réaliser les raccordements RMS utiles sans convertir des simulations en preuves natives. L'unique conseiller architecte a livré un contrat complet puis un addendum. Les deux textes sont récupérés dans sa session native et conservés. Le superviseur ratifie le contrat **pour réalisation et vérification statiques**, avec les précisions ci-dessous ; aucune activation native n'est déduite de cette ratification.

Il reste raisonnable d'implémenter les codecs, jointures, projections et refus pendant que les propriétés du handler sont bloquées. Le parcours complet et la clôture restent conditionnés aux preuves manquantes du contrat approuvé.

## Contrats retenus

1. **Raccord prospectif explicite.** `RuntimeBindingV1` distingue origine fixture v2 et source DATA v3, référence les octets et leur propriétaire d'état unique. Le garde v2, les entrées historiques et les cycles existants restent inchangés. Aucun cast v3 vers v2, transfert d'outbox/autorité, second moteur, store ou watcher.
2. **Quatre domaines d'empreinte non substituables.** Empreinte commande client ; empreinte de l'Admission historique complète (requestDigest S1) ; empreinte du body client durable ; SHA256 des octets RPC réellement observés. L'Admission complète reste la définition historique de l'upstreamBodyDigest dans ce candidat. Ne pas renommer ces domaines pour masquer une différence d'octets ou d'enveloppe.
3. **Jointure avant effet.** `DispatchJoinV1` lie origine, admission, unité, rôle, attempt/execution/idempotence, fences, versions d'entrées, modèle demandé et body retenu. Retry sur les mêmes images, jamais reconstruction sur simple absence. Réponse perdue/absence/unknown reste ambiguë, ne libère pas les claims et n'autorise pas un nouvel envoi sans garantie acquise.
4. **Authentification bornée, sans secret durable.** Les credentials ne sont pas journalisés. La distinction body durable/authentification est déclarée, mais **aucune exclusion d'identité ne devient compatible avec un handler inconnu**. Toute variation sans contrat source/version qualifié refuse l'activation ; le body complet demeure soumis au budget avant émission. Un témoin de transport ne vaut pas preuve d'admission.
5. **Observations attribuables.** Session, profil, Model.Ref effectif, droits worker, admission, résultat et terminaison doivent être reliés à la même jointure. Le défaut de qualification native renvoie un refus explicite avant effet. Inactivité, finish stop et notification sont insuffisants pour la quiescence RMS.
6. **Publication exacte.** `PublicationMaterializationV1` fixe octets, provenance, fences, cible, révisions et manifeste couvert par attestation parent avant pending. Publication exclusive ou existant strictement identique, readback exact puis commit, bindings et receipt. Pas de contenu préannoncé pris pour une nouvelle sortie ; aucun second store ou publication IDB.
7. **Nouveau contexte prospectif.** `NextContextProjectionV1` matérialise des octets publiés, relus, non révoqués et approuvés pour le consommateur. Politique prospective épinglée avant le cycle ; ancien cycle sans cette politique refuse l'overlay. Aucun changement de cycleKnowledge ; A/B sans sorties croisées de famille courante, R avec ses exacts A+B. Révisions, hashes, provenance et bundle effectif font foi, pas READY ou receipt seuls.

Les références d'octets sont fermées et vérifiées, pas des capacités d'autorité. Le writer doit réutiliser les types et primitives existants compatibles, ou définir une forme locale explicite sans élargir des unions historiques. Toute contradiction de contrat remonte au superviseur, pas à un second architecte.

## Réalisation et limites

Le premier writer prépare un plan puis implémente la jonction et ses contrôles d'impact dans son espace isolé. Il doit reprendre la base reçue et manifester les adaptations de chemins/dépendances ; pas partir silencieusement de HEAD. Le parent vérifie ce plan et la composition avant les effets. Les fichiers communs aux étapes publication/contexte ont un propriétaire sériel.

La branche isolée du writer a été vérifiée propre avant seed, sans fichier supplémentaire par rapport à l'inventaire du harness reçu. Le parent y a copié 346 fichiers de harness et dix entrées (356 fichiers), puis un second programme a recalculé toutes leurs empreintes : zéro différence. Les entrées restent byte-identical sous `test/fixtures/rms-static-inputs/`, avec nouveaux chemins déclarés ; leurs imports n'ont pas encore été corrigés. Manifeste : `../evidence/writer-base-seed.json`, SHA256 `3a63072831d888d8fe788c3262d1ff3926310999c0f5e5e59096bb4138dcb96f`. Le codec qualifié original reste préservé séparément dans la copie parent. Ni base, ni autorité, ni origine transférée.

Writer : session `ses_e7be66e44ffeDGFyMV1ca7Rgj8`, agent build ; Model.Ref natif relu : OpenAI Sol xhigh. Son plan est en attente de revue parent ; aucune commande produit autorisée avant cette revue. Le seed ne change pas les pins historiques et ne vaut pas validation comportementale.

Conserver les tests historiques : aucun cas supprimé ou SKIP utilisé pour clôturer. Les nouveaux contrôles doivent démontrer refus avant effet, domaines d'empreinte, retry exact et préservation des gardes. Les contrôles de publication et acquisition de contenu suivent leurs étapes dédiées. Pas de nouvelle infrastructure importante.

Les preuves natives, le délai de remplacement, HOLD125 et les quatre origines restent bloqués. Leur absence ne bloque pas ce code statique, mais interdit son activation et la clôture complète. La revue indépendante finale et l'acceptation parent restent requises.

## Provenance et incident de récupération

Session de l'architecte : `ses_e7bf518b0ffeIgOkK5bOJW2gKI`, Model.Ref natif OpenAI Sol xhigh. Contrat complet : message `msg_1841329a2001a9uy0Uv3DAMMgu`, SHA256 texte `5a608601ad4a960105c661a22d33c31f59b87a6908ab0c4e02821a6425e0c6ce`. Addendum : message `msg_18415996c001X2ErRro2P7CQGf`.

Conservation : `../evidence/ses_e7bf518b0ffeIgOkK5bOJW2gKI-native-finals-bundle.json`. La première récupération de la dernière finale seule contenait uniquement l'addendum ; la lecture bornée de l'historique a donc récupéré aussi le contrat initial. Aucun second conseiller consulté.

La copie du bundle a été écrite avant une assertion libuv à la sortie du processus de récupération (exit 1). Le fichier a ensuite été relu et parsé ; il contient les deux textes complets. Aucun test produit n'est concerné. L'appel explicite à process.exit a été retiré du script local ; aucune réparation du runtime partagé ni relance du worker.

Sources et références de code détaillées : contrat conservé, D2/D4/D6 et contrat S1 historique. Les sources officielles Internet consultées par l'architecte décrivent OpenCode V2, pas les garanties propres au handler manquant.

Localisation : contrat et consommateurs ciblés. Impact : ratification des interfaces et lancement du premier incrément autorisé. Limites : preuve native non obtenue, implémentation et revue finale encore à produire ; aucun PASS global annoncé.
