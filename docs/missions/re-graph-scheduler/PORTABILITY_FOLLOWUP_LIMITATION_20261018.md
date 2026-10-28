# Portabilité — limitation et mission future, pas extension de la mission courante

## Steering utilisateur

L'utilisateur souhaite que le scheduler, ses machines d'état et la logique
d'orchestration puissent fonctionner indépendamment de la plateforme, notamment
sous Linux. Il demande explicitement de NOTER cette limitation pour une prochaine
mission et de continuer le travail en cours, sans ouvrir une migration maintenant.

## Limite actuelle

- La qualification du harnais de contrôle des processus en préparation ici vise
  Windows : sources C#4/.NET4, contrats Windows argv/env, Job Objects et handles.
- Cela ne démontre ni une dépendance obligatoire du cœur du scheduler à Windows,
  ni sa portabilité effective. Aucun audit complet des couplages plateforme ou
  gate Linux/macOS n'a été mené dans cette tranche.
- Les validations Windows, revues source et tests locaux ne sont donc PAS une
  preuve de fonctionnement du scheduler complet sur Linux ou toute plateforme.

## Cible de prochaine mission, à cadrer séparément

Inventorier les dépendances plateforme ; préserver un cœur métier et des machines
d'état portables ; isoler les opérations OS dans des adaptateurs explicites ;
définir les garanties équivalentes et celles réellement indisponibles par système.
Ne pas simuler une garantie Windows par un simple état ou booléen sur un autre OS.
Ajouter des gates réelles par plateforme, dont Linux, avant toute annonce de
compatibilité. Les runtimes et plateformes supportés resteront à fixer.

## Effet sur la mission en cours

Aucun changement immédiat d'architecture/API, aucun portage ou ajout de backend,
aucune nouvelle équipe ou admission pour ce sujet. Continuer les correctifs L8
et full44 data-only, leurs revues indépendantes et les gates parent existantes.
Ce suivi n'autorise ni exécution native/full44 ni élargissement de leur périmètre.
