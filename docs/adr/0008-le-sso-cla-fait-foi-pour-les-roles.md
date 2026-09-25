# Le SSO CLA fait foi pour les rôles, sans historique

Les rôles d'un Membre dans une Structure viennent du SSO CLA, qui est la seule source de vérité. À chaque connexion, Trezo aligne les rôles de la personne sur la réponse du SSO : un poste qu'il ne renvoie plus est supprimé physiquement, un poste changé met à jour la ligne existante, un nouveau poste crée une ligne. Il y a au plus une ligne par couple User × Structure ; plusieurs postes dans la même Structure sont fusionnés en un seul libellé ("Président, Trésorier").

L'ancien historique (`is_active` / `ended_at`, une nouvelle ligne à chaque changement de poste) est abandonné : il n'était lu nulle part et gardait des « membres actifs » que plus personne ne mettait à jour. La date `created_at` d'une ligne est remise à zéro quand le poste change, pour rester la date de début du poste actuel. La migration supprime les lignes inactives existantes : ce choix n'est pas réversible.

Une Structure ARCHIVED ou de démo n'est jamais modifiée par la synchronisation (ni nom, ni rôles). La session n'y donne accès que via un rôle déjà en base, confirmé par le SSO, pour que session et base restent d'accord.

Les règles sont calculées par une fonction pure (`planClaSync`) qui renvoie un plan de changements, appliqué ensuite par une couche Prisma mince en écritures groupées.
