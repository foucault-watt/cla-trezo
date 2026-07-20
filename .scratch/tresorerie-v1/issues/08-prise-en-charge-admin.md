# 08 — Prise en charge Admin

**What to build:** Dès que l'Admin effectue sa première action de modification sur une Note de frais Soumise, elle passe au statut Prise en charge et la Structure perd définitivement la main dessus (ADR-0001) — même si l'Admin ne valide pas encore. L'Admin peut consulter et modifier lignes, montants, sources de financement.

**Blocked by:** 07

**Status:** ready-for-agent

- [ ] L'Admin peut consulter l'intégralité d'une Note de frais Soumise (Justificatifs, Lignes, bénéficiaires, IBAN, sources, Warnings)
- [ ] La première modification de l'Admin fait passer la note au statut Prise en charge
- [ ] Une fois Prise en charge, toute tentative de modification par la Structure est rejetée
- [ ] L'Admin peut modifier les Lignes, montants et sources de financement d'une note Prise en charge
- [ ] Tests au niveau Server Action couvrant : transition Soumise→Prise en charge sur première modif admin, rejet de modification Structure post-verrouillage, modification Admin autorisée
