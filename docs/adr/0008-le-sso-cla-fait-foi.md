# Le SSO CLA fait foi pour les rôles et le Type des Structures

Les rôles d'un Membre dans une Structure viennent du SSO CLA, qui est la seule source de vérité. À chaque connexion, Trezo aligne les rôles de la personne sur la réponse du SSO : un poste qu'il ne renvoie plus est supprimé physiquement, un poste changé met à jour la ligne existante, un nouveau poste crée une ligne. Il y a au plus une ligne par couple User × Structure ; plusieurs postes dans la même Structure sont fusionnés en un seul libellé ("Président, Trésorier").

L'ancien historique (`is_active` / `ended_at`, une nouvelle ligne à chaque changement de poste) est abandonné : il n'était lu nulle part et gardait des « membres actifs » que plus personne ne mettait à jour. La date `created_at` d'une ligne est remise à zéro quand le poste change, pour rester la date de début du poste actuel. La migration supprime les lignes inactives existantes : ce choix n'est pas réversible.

Le SSO impose aussi le nom et le Type des Structures qu'il renvoie, à leur création comme à chaque connexion : `club` → Club, `commission` → Commission, `asso_1901` et `bdx` → Association loi 1901 (Trezo n'a pas de catégorie BDX, un BDX fonctionne comme une Association loi 1901). Un Type SSO inconnu fait échouer la connexion plutôt que d'être deviné. Le choix manuel du Type par un Admin disparaît : il aurait été écrasé à la connexion suivante. Tant que le SSO n'envoie pas le Type (service non autorisé côté SSO), le Type existant est gardé ; une Structure héritée que le SSO ne renvoie jamais reste sans Type, affichée « Non classée ».

Une Structure ARCHIVED ou de démo n'est jamais modifiée par la synchronisation (ni nom, ni Type, ni rôles). La session n'y donne accès que via un rôle déjà en base, confirmé par le SSO, pour que session et base restent d'accord.

Les règles sont calculées par une fonction pure (`planClaSync`) qui renvoie un plan de changements, appliqué ensuite par une couche Prisma mince en écritures groupées.
