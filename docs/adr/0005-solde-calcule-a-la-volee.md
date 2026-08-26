# Le Solde du Club est calculé à la volée, jamais stocké

Le Solde d'un Club n'existe comme aucun champ dédié : il est recalculé à chaque lecture comme la somme des Mouvements de solde du Club (Entrées manuelles, Sorties manuelles, et un Mouvement créé par Remboursement financé par le Solde une fois la Note de frais Validée). Ce choix élimine tout risque de désynchronisation entre le Solde affiché et l'historique des mouvements qui le justifient, au prix d'un recalcul à chaque consultation plutôt que d'une simple lecture de champ.
