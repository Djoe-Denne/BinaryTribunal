# 206. Nouvel acte de contrôleur, sans réactivation des droits de travail

## Objectif et décision

Le raccord RMS en lecture seule est prêt côté code et revue. Son exercice réel reste bloqué par le bail expiré du contrôleur : ce bail désigne le parent autorisé à piloter la mission à cet instant. Le parent décide de préparer une acquisition distincte par l'API existante `Store.acquireLease`, avec le même propriétaire et un nouveau numéro de protection contre les anciens contrôleurs (fence).

Ce n'est pas un renouvellement du permis modèle170. Aucune opération, origine, allocation, claim, identité parent ou autorité métier ne doit être recréée. L'acquisition sera exécutée seulement lorsque la requête et la réception externe du résultat seront prêtes, pour ne pas laisser expirer inutilement ce nouveau bail.

## Effets inspectés et contrôles fermés

Le constructeur Store ouvre la base existante, vérifie ses métadonnées, demande le mode WAL et des créations de tables si absentes. La lecture préparatoire confirme que les tables attendues et la métadonnée engine/version1 sont déjà présentes. `acquireLease` prend une transaction immédiate, refuse un autre propriétaire actif, incrémente le fence et ne modifie que les trois colonnes du bail dans la ligne mission. `renewLease` n'est pas utilisé sur le bail expiré.

L'acte ponctuel doit comparer les empreintes logiques de toutes les tables avant/après le constructeur puis avant/après acquisition, sans copier la base. La seule différence permise est celle des trois colonnes de bail de la mission exacte. Les schémas, l'identité et l'événement parent, le root révision3, son origine unique, les claims et débits doivent rester inchangés. Toute divergence arrête la qualification et est conservée, sans compensation ou retry automatique.

La requête fermée V2 sera liée au nouveau fence, aux mêmes principal/actor/mandat et aux pins203 ainsi qu'au bootstrap193. La qualification conservera les deux GET seulement, les POST refusés et une réception externe vérifiant fin réelle, durée totale, expiration et hashes. Aucun reçu provisoire n'est adoptable seul.

## Preuves et limites actuelles

- Source relue : candidat198 `src/store.ts:8–35,48–68` ; imports de validation localisés, pas d'entrée native importée.
- Lecture actuelle de la base : une mission, métadonnée engine1, fence1 expiré ; une opération, un root, un claim et aucune identité d'auteur RMS retenue. Cette lecture confirme les prérequis de l'acte, pas une nouvelle qualification.
- Preuves205 conservées. Aucune acquisition ni nouveau fence n'a encore été exécuté dans cette préparation.
- Tranche B, droits B/R, publication, scénario final et acceptation M2 restent ouverts. Les règles d'arrêt et le plafond de trois origines restent inchangés.

## Préparation des deux actes ponctuels

`prepare-owned-controller-206.mjs` prépare l'acte de bail et la requête, sans lancer l'hôte. `receive-owned-readonly-206.mjs` prépare séparément l'invocation fermée et son contrôle externe. Ce ne sont pas de nouveaux points d'entrée publics ou un harnais général : ils restent dans le dossier de mission et ne modifient aucun fichier produit.

Le second acte refuse un résultat tardif, non nul, invalide ou non rapproché ; il compare le hash canonique de la candidate, le reçu provisoire exact, les identités d'invocation, les deux réponses, la fermeture de scope et d'enfant, les pins et la continuité logique RMS. Il ne déduit aucun chargement DLL/WASM du succès HTTP.

Les deux scripts ont passé `node --check` (syntaxe seule, aucun import ou corps évalué). La revue indépendante bornée de leurs effets et de la réception externe est demandée au reviewer existant. **Ni le bail ni la qualification n'ont encore été exécutés.** Les formes exactes de chemins des pins sont conservées telles qu'elles figurent dans le plan193, sans reconstruire leur JSON à partir d'une simple équivalence Windows.
