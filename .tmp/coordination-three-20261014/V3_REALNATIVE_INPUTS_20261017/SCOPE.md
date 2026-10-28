# Source RealNative — IGuardianOwnerNative réel, Win32 exact — plan puis écriture

Fresh auteur, disjoint de tous les auteurs/reviewers V3. NONBLIND déclaré.
Objet : implémenter RÉELLEMENT le seam natif côté OWNER que le noyau gelé
consomme — `IGuardianOwnerNative` (14 membres exacts, à confirmer par TA lecture
de GuardV3.Contracts.cs bb4758cc et des points d'appel GuardianCore.cs 7d4d2c66)
— avec P/Invoke Win32 réel, pour permettre la qualification slice 2 (cas
real-Job). Le noyau est GELÉ intouché ; le seam n'est PAS modifié ; la seule
implémentation FAKE ( FakeNative, tests ) reste telle quelle.

Sémantique Win32 exigée (source : contrat draft2 ratifié bb69e0ad, corrections
#2/#3/#4, tests gelés aefc941e) :

- Création Job : CreateJobObjectW, SD=NULL, héritage 0 ; limites
  JobObjectExtendedLimitInformation (144 = 64+48+32), Basic PerJobUserTimeLimit 0,
  ActiveProcessLimit 8, JobMemoryLimit réel 4294967296, LimitFlags 0x2208
  (0x8|0x200|0x2000 — pas de 0x2a08/0x3208 breakaway) ; SetInformationJobObject
  puis relecture exacte 144B (limite ]0x2208|8|4GiB[ reçue).
- Création T : CreateProcessW CRÉÉ SUSPENDU (dwCreationFlags 0x80404), STARTUPINFOEX
  (112 = 104+8), attribut list PROC_THREAD_ATTRIBUTE_HANDLE_LIST 0x20002 = 3
  stdio hérités ; inheritance S/D=0, stdio=1 ; T héritage du Job 0.
- Assign : AssignProcessToJobObject UNE fois ; vérification IsProcessInJob ;
  relecture des limites ; ResumeThread UNE fois (prior==1).
- Observation : les requêtes kernel restent dans KernelObserver (gelé) — tu ne
  les dupliques PAS.
- Arrêt : TerminateJobObject / TerminateProcess owned ; CloseHandle par outcome,
  jamais pendant un borrow ; AUCUN OpenProcess/PID-reopen (corrections #2/#3) ;
  AUCUN IOCP ; aucun compteur driver ; aucun DuplicateHandle.
- Échec fail-closed : chaque erreur Win32 mappée vers la sémantique du seam
  (GetLastError immédiat), jamais avalée silencieusement.

LIVRABLES (output assigné, EXACTEMENT 4) :
1. RealNative.cs — l'implémentation réelle du seam (P/Invoke Déclarations
  exactes, structures alignées, aucun membre du seam écarté).
2. RunnerReal.cs — le harnais de qualification slice 2 pour le PARENT UNIQUEMENT
  (jamais exécuté par toi ni par la review) : construit l'autorité/binding réels
  avec RealNative + lance GuardianCore.Run sur un T RÉEL (enfant bref exit —
  par exemple CreateProcessW sur un binaire système anodin ou self-exit),
  requêtes kernel réelles via KernelObserver, quiescence réelle, ACK factice
  interdit — le harnais GÉNÈRE les faits ; aucune assertion sur
  KernelQuiescenceObserved ne constitue un PASS central.
3. DESIGN.md — droits/durées de vie réels, mappage erreurs Win32→sémantique,
  préconditions d'exécution slice 2 (qui lance quoi où, environnemt), limites
  NOT_PROVEN publiées (last-close, budget intégré, multi-process, durée du
  lease).
4. MANIFEST.json — pins, statuts, racines.

Si le seam exige un membre impossible en Win32 réel de la façon décrite, HOLD +
rapport (l'arbitrage ABI est ma gate — pas ta modification).

PHASES : 1 ACK pins puis HOLD ; 2 sur GO = PLAN SEULE (décision des
Déclarations P/Invoke par membre du seam avec source:ligne du noyau, choix du
T réel, ordre du harnais) ; 3 sur plan-GO = écriture + rapport public + HOLD
pour review fresh.

INVARIANTS : noyau gelé intouché (re-hash parent) ; C#5 strict ; conventions ;
PAS de compile, PAS d'exécution de quoi que ce soit — surtout PAS de
CreateProcessW/Job réel pendant ton travail (le parent exécute RunnerReal en
qualification, gate séparée) ; caps 262144/chunk 4096/HOLD collant ;
last-close NOT_ESTABLISHED. Modèle imposé : cursor/grok-4.7 Grok 4.7 Extra
High (complexité 78), spawn fresh, Model.Ref vérifié.
