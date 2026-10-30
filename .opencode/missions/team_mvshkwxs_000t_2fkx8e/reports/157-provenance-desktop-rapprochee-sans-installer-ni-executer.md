# 157. Provenance desktop rapprochée sans installer ni exécuter

## Problème et résultat concret

Le permis exige une empreinte de source, alors que nous ne disposions que de celle du binaire installé. La revue a refusé, à juste titre, de remplacer cette preuve par un hash documentaire arbitraire. Le parent a poursuivi un rapprochement borné des métadonnées locales et des distributions publiques.

La première comparaison est **négative** : l'archive CLI officielle vérifie son empreinte annoncée, mais son exécutable diffère de celui du serveur installé. Ce résultat est conservé, pas renommé en succès.

La piste desktop explique la différence. Le journal local montre que le serveur a été copié depuis l'exécutable embarqué dans l'application desktop. Cet exécutable et le serveur installé ont la même empreinte. Le cache local contient aussi l'installateur desktop dont la taille et l'empreinte correspondent exactement à l'asset public de la release2.2.1. L'exécutable présent dans cet installateur, haché directement en flux, correspond lui aussi **byte pour byte** au serveur installé.

## Référent source désormais concret

Le tag public2.2.1 résout vers le commit3ebcf9a32c7b28f658cfee80775448929361727a, celui des sources publiques déjà retenues. Le parent a téléchargé l'archive source complète à ce commit et calculé son empreinte réelle. Les deux fichiers de permissions du corpus existant sont retrouvés dans cette archive avec leurs bytes et empreintes exacts.

Cela fournit un référent source attribué par la distribution publique correspondante, **pas une preuve de build reproductible ni d'équivalence de tout le code chargé en mémoire**. Le parent propose de donner cette signification explicite au champ source du permis, sous revue ciblée. Le hash de l'archive source serait alors celui d'un artefact réellement chargé et conservé, non celui d'un manifeste choisi pour satisfaire le validateur.

## Vérification et limites conservées

L'installateur n'a pas été exécuté. Aucun binaire de distribution n'a été installé, remplacé ou lancé. Seule l'archive interne de l'installateur a été copiée dans un espace temporaire possédé ; son exécutable a été lu en flux pour calculer son empreinte, sans être écrit sur disque. L'installation et le serveur n'ont pas été modifiés.

La comparaison de l'archive CLI a pris62,926s ; le téléchargement de l'archive source5,676s ; le hachage en flux de l'exécutable desktop300ms. Aucun contrôle n'a atteint dix minutes. Ce sont des contrôles de provenance, pas un rejeu scientifique ou une qualification de comportement native.

La réalisation du raccord continue en parallèle. Le refus avant possession reste actif tant que la revue n'a pas accepté le référent exact de source. L'enforcement des outils, le quota, la validité du résultat et la fin native restent distincts et non prouvés par ce rapprochement.

## Annexe technique

- [Chaîne de provenance et comparaison négative conservée](../evidence/server-release-provenance-157.json).
- Binaire installé, embarqué et extrait en flux de l'installateur :253347720octets/SHA9ecb888ec3b28a393782269f531d1528ea21ff940f694752717e48a77b90527e.
- Installateur desktop local et digest public :260474032octets/SHAf735299860748211e0af540d50a5d5a70d43d96e3a5c23f3aa4da04970af67a2.
- Archive source réelle :82421743octets/SHA752dbd73150920607daa8d4d87d3080451fb3f89973d98141897392348bbaedd.
- Outils d'archive existants :7-Zip23.01 et tar système. Aucune installation d'outil ou configuration globale.
- Espace temporaire possédé : rms-build-provenance-157 sous le répertoire temporaire OpenCode approuvé ; artefacts conservés, aucun nettoyage implicite.
- Note de méthode : métadonnées PE Bun1.4.4 et package desktop2.2.1 seules insuffisantes ; les marqueurs fixes recherchés n'ont pas fourni de commit. L'absence de ces marqueurs n'est pas une preuve d'absence de toute autre métadonnée.
