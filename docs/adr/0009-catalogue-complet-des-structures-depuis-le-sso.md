# Le catalogue complet des Structures vient du SSO CLA

À la connexion d'un Admin, le catalogue complet fourni par le SSO impose les Structures actives, leurs noms, leurs Types et leurs membres, même jamais connectés. Une Structure absente passe en `INACTIVE`, une Structure de retour redevient `ACTIVE` ; aucune n'est supprimée, pour préserver les relations avec les Notes de frais, Subventions, Mouvements financiers et Documents d'octroi. Les Structures archivées et de démo restent intouchées, rôles compris.

Comme décidé dans l'ADR-0008, les rôles n'ont plus d'historique : les postes perdus sont supprimés et les postes changés remplacent les précédents. Cette règle s'applique désormais à tous les membres lors de la synchronisation complète. Les Users sans rôle sont conservés ; les nouveaux comptes ont `isAdmin=false` et un cursus nul, complétés à leur propre connexion. Le catalogue ne modifie pas les attributs des comptes existants.

La synchronisation personnelle reste dans la requête pour établir la session. Le catalogue est appliqué dans une transaction après la réponse via `after()` : son échec est journalisé sans bloquer la connexion. Un catalogue absent ne change rien ; un catalogue explicitement vide désactive les Structures ordinaires et supprime leurs rôles. Les lectures et écritures sont groupées ; les mises à jour de noms et de postes distincts utilisent des requêtes SQL paramétrées par lot pour éviter un aller-retour par ligne.

Les droits déjà présents dans un cookie de session restent valides jusqu'à la reconnexion (révocation immédiate hors périmètre de #37). La synchronisation nécessite le drapeau `share_all_associations` activé pour Trezo côté SSO.
