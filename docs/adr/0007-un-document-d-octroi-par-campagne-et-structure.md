# Un Document d'octroi par Campagne × Structure, choisi selon le type de Structure et régénérable

Une Structure peut recevoir plusieurs Subventions dans une même Campagne de subvention. Plutôt qu'un document par Subvention, on génère un seul Document d'octroi par couple Campagne × Structure, qui liste toutes ses Subventions et leur total : c'est ce que la Structure reçoit et signe en pratique.

Le type de document découle du type de la Structure : Convention de subvention pour une Association loi 1901, Ordre de financement pour un Club ou une Commission. Une Structure sans type ne peut pas recevoir de Document d'octroi, pour ne jamais émettre le mauvais document (le type vient du SSO CLA, cf. ADR-0008).

La génération est manuelle, réservée à l'Admin, et possible seulement une fois la Campagne publiée. Le PDF est stocké et référencé dans une table dédiée, avec une contrainte d'unicité sur (Campagne, Structure). Contrairement aux PDF finaux de Note de frais (cf. ADR-0003), un Document d'octroi n'est pas figé : une régénération remplace le fichier et l'enregistrement, sans historique, et le dernier document généré fait foi.
