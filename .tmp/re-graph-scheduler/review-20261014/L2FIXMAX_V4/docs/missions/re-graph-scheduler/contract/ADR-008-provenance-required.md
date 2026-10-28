# ADR-008 — La provenance native est obligatoire

**Statut :** gelé pour L1, en attente de validation lead.
**Date :** 2026-10-13.

## Décision

Toute preuve native porte `Provenance` : hash du module, site (RVA ou null seulement pour un import pur / une citation d'extracteur), `siteKind`, `xrefType` (`code` | `data` | `none`), source, version de source, hash de source, hash de preuve.

Une date, un nom de fichier ou un chemin seuls ne sont pas une preuve. `source` est un identifiant d'outil ou de citation ; `sourceHash` et `evidenceSha256` sont des SHA-256. Les catégories de confiance sont `high|medium|low|unknown`, jamais des probabilités calibrées.

Un bulletin R n'est ni un `KnowledgeDelta`, ni une origine de delta (`origin` ne commence pas par `bulletin`), ni un prérequis satisfait.

## Conséquences

L2 refuse une arête ou un objet sans provenance complète. L6 ne promeut pas un bulletin. Les fixtures synthétiques portent une provenance d'extracteur fixture, explicitement non native.
