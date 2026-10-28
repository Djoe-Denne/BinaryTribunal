# Session reprise(s) v17 Lot 25 — enregistrement de session (2026-10-04)

Archive assainie de la session interactive « pass 2 bis reprise » : actions
opérateur, décisions parent, livrables des sous-agents (sessionIDs), incidents.
Aucun contenu de télémétrie ni dump brut ; les preuves hash-bound vivent dans
les reçus cités du catalogue
`projects/re-ff8/references/af3dn-captures-evidence-catalog-lot25.md`.

## Chronologie opérateur (une action à la fois)

1. « continuons avec se quetu penses être le mieux » — reprise autorisée ;
   redéploiement v17 (reprise 1) puis demande d'ouverture.
2. « ouvert » — lecture du diagnostic : STOP (detach armé sans restore, sans
   PID) ; fermeture normale demandée.
3. « fermé » — archive + rollback byte-exact + retrait sidecars ; verdict
   révisé après témoignage (voir ci-dessous).
4. Témoignage : 1er lancement en erreur (boîte technique adresses), 2e propre.
   Réinterprétation prudente : terminaisons de processus plausibles, non
   établies par PID ; WER localise le crash dans `dotemu_orig.DLL`
   (`c0000005` +0xDF52), cause non établie, 3 crashs antérieurs d'empreintes
   différentes (dont un dans AF3DN.P le 23-09).
5. « go » (reprise 2) — déploiement déjà vérifié ; pré-armement en lecture
   seule conforme ; capture NON armée.
6. Question légitime « qu'est-ce qu'on attend ? » → vérification : le harnais
   B annoncé n'avait produit AUCUN livrable (sous-agent échoué `uv_spawn`) ;
   l'attente était sans objet — erreur d'orchestration reconnue.
7. Test ciblé créé, compilé (1er build refusé préservé, retry script CMD OK)
   et exécuté au premier plan : contrôle wrapper=exit 0 ; bypass
   FreeLibrary=exit 3 `FAIL_DANGLING_E8_REPRODUCED` → v17 bloqué.
8. « fermé » (2e) — archive 3 artefacts (CSV 760 912 957 o streaming) +
   rollback byte-exact + retrait marker + validation parent.

## Sous-agents (sessionIDs, statuts, livrables)

| Instance | Session | Statut | Livrable |
| --- | --- | --- | --- |
| mechanical-worker (loader rendu) | `ses_ef8d11c25ffeYVHw0g4qE7Gd7T` | terminé | `lot25_render_input.py` + `test_lot25_render_input.py` ; decode strict → objets Lot 21, aucune réparation d'indices |
| live-campaign-runner (reprise 1) | `ses_ef8aa0f54ffeHiMU7WQzwUNrNN` | terminé ×3 | redéploiement+backup frais ; close/archive/rollback reprise 1 ; redéploiement reprise 2 (`resume2-…d77eb136`) |
| explore (diagnostic fermeture) | `ses_ef898dee9ffecm3lCPdfp1HhA5` | 1er appel bloqué (ContextMode indispo.), 2e concluant via extraits fournis | constats source : garde dans wrapper seul, detach snapshot_only, `saved_match=0` ≠ échec restore ; cas harnais manquants |
| general (harnais B complet) | `ses_ef88df2b2ffeexrJRhrxTl2ZI2` | **ÉCHOUÉ** `uv_spawn`, 0 livrable | néant — ne jamais compter comme gate |
| mechanical-worker (reproducer unload) | `ses_ef87d51adffe694TCenbSAQBNn` | terminé | `harness_lot25b_unload.c` (compilé seul, non exécuté par lui) |
| general (revue politique unload) | `ses_ef83b1906ffeBXHOlkp7W0BVPE` | **terminé** — recommandation : option B en prototype v18 offline, déclaré `NO_HOT_UNLOAD` (opt-in à l'attach sans écriture ; activation différée via le PresentDispatch existant ; self-PIN confirmé HORS loader-lock avant tout E8, échec PIN = zéro écriture ; état `RESTORED_RETAINED`, jamais « Detached green » ; détours boot/Present/ODS hors garantie → blocage live global maintenu). Rejets : A seul insuffisant, PIN dans detach/Move garde dans DllMain/return FALSE rejetés, C disproportionné. Gates offline listées (attach+FreeLibrary sans E8, activation explicite, chemin Present réellement exercé, restore 6 o + 14 voisins avec module retenu, refus PIN = 0 écriture, nohook, ExitProcess distinct, régression contrat, garantie globale explicitement bloquée). Parent : direction retenue, implémentation v18 non commencée. |

## Corrections parent en cours de session

- Patch harnais avant exécution : FreeLibrary effectif en contrôle, garde
  anti double-FreeLibrary, échecs de cleanup propagés au code de sortie,
  marker fermé, bornage chemins/RVA négatif.
- Errata docs : rectification « STOP → explication terminaison » (puis
  re-prudence : corrélation ≠ attribution), erratum crash WER (pas
  d'innocentation v17), erratum orchestration (attente sans travail actif).

## Leçons (pour les prochaines sessions)

- Ne jamais annoncer une gate « en cours » sans livrable vérifié ; vérifier
  l'existence des fichiers avant de faire attendre l'opérateur.
- Un journal sans PID ne distingue pas terminaison et déchargement : formuler
  les verdicts en témoin manquant, pas en cause identifiée.
- Un garde dans un chemin optionnel (wrapper slot 1) ne couvre pas
  l'opération encadrée (FreeLibrary direct) — voir page audit d'unload.

## Suite consignée

Prompt de reprise pour la session suivante (implémentation prototype v18
offline `NO_HOT_UNLOAD`) archivé intégralement dans
`next-session-handoff-v18.md` (même dossier). La session de reprise y
retrouve : état à revalider, hashes figés v17, direction B, gates offline
A–I, invariants, livrable attendu.
