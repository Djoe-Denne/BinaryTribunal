# 177. Pas de lanceur CLI établi pour la rétention du journal

## Résultat et décision

La lecture source ciblée ne trouve pas de commande du CLI2.2.1 qui transmette events.persist au serveur. Le parent a corroboré les options de serve et de ServerProcess : elles ne portent pas ce réglage. Aucun flag ou champ de configuration détourné ne sera inventé.

Une surface SDK publique accepte l'option de rétention, mais il s'agit d'un hôte embarqué distinct. Son installation locale, ses dépendances et une connexion HTTP compatible avec le transport RMS ne sont pas établies. Le parent **ne retient pas cette piste comme solution exécutable** à ce stade.

Aucune installation, import SDK, compilation, ouverture de port, création de serveur ou modification du desktop n'est engagée. Une éventuelle adoption nécessiterait un plan d'infrastructure mesuré et vérifié, pas la simple existence d'une API dans l'archive source.

## Suite proportionnée

La revue indépendante de la fermeture minimale du témoin de tour reste la prochaine dépendance utile. Elle doit distinguer les preuves nécessaires pour une session de campagne à producteur parent unique des exigences plus fortes que ce périmètre, sans traiter une hypothèse déclarée comme une preuve native.

Le journal vide, l'ACK170 et les droits expirés restent inchangés. Pas de nouvelle opération, origine, serveur ou configuration pour tenter de recréer l'histoire passée. Le parcours complet n'est pas déclaré accepté.

## Ancrages et limites de couverture

- packages/cli/src/commands/commands.ts568–580 : serve expose hostname/port/cors/service/stdio ; corroboré parent dans l'archive157.
- packages/cli/src/server-process.ts25–30 : Options sans events ; corroboré parent. Le constructeur a également suivi sa construction de serveur104–140.
- packages/sdk/src/internal/host.ts18–42 : CreateOptions dérive des options serveur et crée un hôte embarqué, base mémoire par défaut ; corroboré parent. Pas une preuve de disponibilité locale ou de listener HTTP.
- Finding SOURCE_ONLY_LAUNCH_SURFACE_AUDIT_COMPLETE_NO_DROPIN_INSTALLED_CLI_LAUNCHER_PROVEN ; sources et exports consultés seulement. Pas une preuve d'absence globale de tout autre lanceur possible.
- Aucune propriété native de l'installation ne résulte de cette lecture source ; aucun test ou lancement n'a été exécuté.
