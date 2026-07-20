# L'IBAN n'est jamais stocké durablement en base

L'IBAN est saisi lors de la création d'une Note de frais et stocké temporairement, uniquement pour permettre la génération du PDF final. Une fois le PDF généré, l'IBAN est supprimé de la base applicative — il ne persiste nulle part côté application, ni pour affichage ultérieur ni pour une éventuelle régénération. Le PDF archivé devient la seule source contenant l'IBAN. Ce choix limite l'exposition d'une donnée bancaire sensible, au prix de ne plus pouvoir régénérer un PDF ou corriger une note après coup sans ressaisie.
