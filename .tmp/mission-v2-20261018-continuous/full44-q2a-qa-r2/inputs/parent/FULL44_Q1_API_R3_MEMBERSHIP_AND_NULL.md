# Clarifications parent R3 — aucun changement de layout/caps

Complète API_FIXED_R1 et clarification shortflagR2, sans réécrire leurs pins.
1. Membership entry-name ↔ AllowedEnvironmentNames est OrdinalIgnoreCase.
   Noms Windows insensibles à la casse, comme unicité/tri/politique fermée déjà
   fixés. Aucune normalisation de casing ni réécriture des chaînes encodées :
   les noms caller gardent leur casse dans leurs vecteurs triés. Un changement
   de casse peut donc changer les bytes canoniques/intent ; ne pas exiger le
   même hash par simple équivalence de membership.
2. TryEncodeCanonical(null,...) doit refuser : false, canonical=null,
   refusal!=None. Aucun code d'enum précis nouveau n'est imposé pour ce cas.
   C'est la clarification de l'échec data-only, pas une méthode/un champ ajouté.
3. TryCountControlFiles additionne les arrays EFFECTIVEMENT fournis : aucun
   record canonique ni réserve cachée implicites. Totaux32767/32768 acceptés,
   32769 refusé avec totalBytes=0 ; si l'appel veut compter un record, il doit
   fournir ces bytes dans le tableau. TryBuild compte bien canonical+additional
   selon le contrat fixé ; la fonction standalone n'invente aucun crédit.

Source R2 reste proposée/figée, pas une preuve qu'elle satisfait R3. V fresh
composé vérifie réellement source+QA, corrige si besoin avant compile/run parent.
Aucun host/OS/file pin/launch/full44/native/Q1 réel ou budget125s n'est autorisé.
