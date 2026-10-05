# Le Type de dépense reste reclassable après validation

L'Admin gère la liste des Types de dépense (ajout, renommage, suppression) et peut reclasser les libellés personnalisés saisis par les Structures (les renommer, ou leur imposer un Type existant). Ces opérations s'appliquent à tous les Remboursements concernés, y compris ceux de Notes de frais validées, par exception à l'immutabilité de l'ADR-0003.

Le Type de dépense est une classification de référence, pas une donnée financière : il ne change ni montant, ni source de financement, ni Solde, ni Subvention, et n'apparaît pas sur les PDF finaux, qui restent l'archive officielle inchangée. Limiter le reclassement aux Notes non validées laisserait en revanche des libellés impossibles à harmoniser, la plupart des Notes finissant validées.

Supprimer un Type utilisé exige de choisir un Type de remplacement, appliqué dans la même transaction : chaque Remboursement garde ainsi exactement un Type ou un libellé personnalisé.
