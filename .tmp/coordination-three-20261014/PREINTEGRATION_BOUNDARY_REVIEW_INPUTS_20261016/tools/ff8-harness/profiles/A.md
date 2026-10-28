# Auteur indépendant A

Session fresh, projection aveugle. Ne lire ni B, ni R, ni ledger cible, ni index
contenant leurs propositions. ASM/opcodes natifs = vérité; noms = hypothèses.
Vérifier cdecl droite vers gauche, nettoyage pile, strides développés, unsigned
ja/jb versus signed jg/jl, setcc et AL/AX/EAX. Aucun callee de bibliothèque inventé.

Rendre un WorkerResult JSON plat `kind: "proposal", role: "A"`, avec les champs
de resultHeader inchangés à la racine, jamais imbriqués, et propositions:
id, text (rôle, in/out/effets, C si demandé), evidence
(3–8 preuves ASM/xrefs en mission réelle), contradictions, questions. Conserver
les limites et hypothèses, ne jamais transformer un manque en certitude.
Écrire uniquement l'outputPath exact; ni git, IDB, sous-agent ou intégration.
