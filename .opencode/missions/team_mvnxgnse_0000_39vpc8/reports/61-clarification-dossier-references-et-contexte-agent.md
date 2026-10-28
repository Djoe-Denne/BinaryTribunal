# Clarification : dossier de travail, fichiers référencés et contexte de l'agent

## Question utilisateur et décision en attente

L'utilisateur demande si le problème est d'éviter de saturer le contexte en envoyant physiquement tout le contenu des fichiers, plutôt que leurs liens. **Ce n'est pas une ratification du59/60.** Aucun GO S2/code/test/native supplémentaire.

## Vérification ciblée du code actuel

Parent a relu domain.ts:10–23/75–86, graph-adapter.ts:200–205 déjà examiné et inputs.ts:24–55.

- ArtifactFile contient path/sha256/version/provenance/kind, pas le contenu complet du fichier.
- InputBundle.files et knowledge.files sont des listes de ces références. La commande contient donc le manifeste de ces fichiers, pas automatiquement leurs bytes complets.
- FrozenProposal contient au contraire content et document ; certaines informations sont effectivement incluses dans le message, notamment propositions et métadonnées/contextes structurés selon le rôle.
- checkInputs lit les fichiers via InputAccess pour vérifier accès et hash. Cette lecture par le programme n'est pas une preuve que tous ces bytes sont envoyés au contexte du modèle.

Conclusion : la voie actuelle est **hybride** ; ni « tout embarqué », ni « uniquement des liens ». La proposition Admission canonique conservatrice inclut tous les champs de commande, mais cela ne transforme pas des références de fichiers en contenus inline.

## Correction de l'explication précédente

« Dossier scientifique complet » ne devait pas être compris comme « tous les fichiers physiquement intégrés au prompt ». L'explication60 pouvait laisser croire que le plafond sur la commande suffisait à borner tout le contexte consommé : **ce n'est pas démontré et ce serait inexact en général**.

La taille en octets du message initial, le volume de fichiers ensuite lu, les réponses d'outils et la fenêtre en tokens du modèle sont des grandeurs distinctes. Un petit manifeste peut référencer de gros fichiers ; leur lecture intégrale ultérieure peut saturer le contexte même si le message initial respecte son plafond.

Le contrat DRAIN588–589 interdit en outre d'utiliser de simples context refs sans acquisition pour réduire artificiellement la taille justifiant une admission. La future fermeture du contrat doit donc expliquer ce qui est embarqué, ce qui est acquis/référencé et ce qui est effectivement consommé, sans utiliser des liens comme contournement de budget. Aucun relâchement de cette obligation n'est autorisé.

## Conséquence pour la suite

La demande actuelle appelle une clarification, pas une nouvelle demande immédiate de ratification réseau/auth. Avant de reposer un choix de contrat, préciser avec l'utilisateur la stratégie de fourniture du contexte et sa mesure : contenu inline, références versionnées et accès ciblés peuvent éviter la redécouverte sans imposer un dump complet de fichiers. C'est une possibilité de conception, pas un mécanisme déjà implémenté/validé ni un GO d'extension.

Maintenir S1 qualifié dans sa portée DATA/pures55, intégration et S2 en attente, garanties body03/DRAIN encore ouvertes au niveau consommateur. Les résultats acquis restent valides ; aucun test à rejouer pour cette explication. Aucun fichier produit/test/candidat/DB modifié ; seulement ce rapport et le journal.
