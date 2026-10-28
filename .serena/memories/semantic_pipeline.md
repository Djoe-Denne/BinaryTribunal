# Pipeline sémantique (1+V / 1+P / 2+1)

- Défaut 1+V : semantic-analyste (rôle A) puis semantic-reviewer (rôle V, adversarial).
  Verdict V : ACCEPTE | CORRIGE | ESCALADE_2+1.
- 1+P autorisé si ≤80 instructions et A sort CERTAIN + nom confirmé ; vérification orchestrator, pas de V.
- 2+1 (escalade uniquement) : B aveugle (même agent relancé sans voir A ni V) puis
  semantic-reconciler (R) tranche contre l'ASM — jamais une moyenne.
- Déclencheurs 2+1 : >200 instructions, A UNCERTAIN/menteur/CONFLICT, désaccord V sur
  rôle/nom/confiance, checks §5.6 KO.

Checks §5.6 (orchestrator, en ASM live, bloquants avant tout push) :
- chaque callee cité existe (callees / add esp cohérent) ; chaque caller existe (xrefs_to, noter DATA vs code) ;
- strides développés en hex (0x1D0, jamais 232) ;
- polarité setcc + ja/jb (unsigned) vs jg/jl (signed) cohérente avec le rôle ;
- valeur de retour (AL vs AX vs EAX) compatible avec l'usage ;
- verdict de nom justifié par ≥2 preuves (pas le nom IDA seul).