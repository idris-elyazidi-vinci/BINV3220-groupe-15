import { expect, test, type Page } from "@playwright/test";

// Scénarios décrits dans e2e/recherche-offres/scenarios.md (EF-30).
// Données : base E2E recréée depuis le seed au démarrage (voir playwright.config.ts).
// Les scénarios sont en lecture seule : ils peuvent s'exécuter dans n'importe quel ordre.

const OFFRES_PUBLIEES = [
  "Application React de gestion de flotte",
  "API REST de facturation",
  "Tableau de bord de qualité des données",
  "Assistant conversationnel interne",
];

/** Connexion de démonstration en tant qu'étudiant Lucas Dupont, puis page « Offres ». */
const ouvrirOffresEnTantQueLucas = async (page: Page) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Lucas Dupont" }).click();
  await page.getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Offres" })
    .click();
  await expect(page.getByRole("heading", { name: "Offres de stage" })).toBeVisible();
};

/** Lignes de données du tableau des offres (sans la ligne d'en-tête). */
const lignesOffres = (page: Page) => page.getByRole("table").locator("tbody").getByRole("row");

const champRecherche = (page: Page) =>
  page.getByRole("searchbox", { name: "Rechercher par titre" });

test.describe("Recherche d'offres par titre (EF-30)", () => {
  test.beforeEach(async ({ page }) => {
    await ouvrirOffresEnTantQueLucas(page);
  });

  test("Scénario 1 — une recherche « API » en majuscules ne montre que l'offre publiée correspondante", async ({
    page,
  }) => {
    await expect(page.getByText("4 offres", { exact: true })).toBeVisible();
    await expect(lignesOffres(page)).toHaveCount(4);

    await champRecherche(page).fill("API");

    await expect(page.getByText("1 offre", { exact: true })).toBeVisible();
    await expect(lignesOffres(page)).toHaveCount(1);
    const ligne = lignesOffres(page).first();
    await expect(ligne.getByRole("cell").nth(0)).toHaveText("API REST de facturation");
    await expect(ligne.getByRole("cell").nth(1)).toHaveText("Orbis");
    await expect(ligne).toContainText("Publiée");
    // Contient « api » mais archivée : invisible pour un étudiant, même via la recherche.
    await expect(page.getByText("Numérisation d'archives papier")).toHaveCount(0);
  });

  test("Scénario 2 — une recherche sans résultat affiche le message dédié, puis vider le champ rend les 4 offres", async ({
    page,
  }) => {
    await expect(lignesOffres(page)).toHaveCount(4);

    await champRecherche(page).fill("blockchain");

    await expect(page.getByText("Aucune offre ne correspond à la recherche.")).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByText("Aucune offre à afficher.")).toHaveCount(0);

    await champRecherche(page).clear();

    await expect(page.getByText("4 offres", { exact: true })).toBeVisible();
    await expect(lignesOffres(page)).toHaveCount(4);
    for (const titre of OFFRES_PUBLIEES) {
      await expect(page.getByRole("cell", { name: titre, exact: true })).toBeVisible();
    }
    await expect(page.getByText("Aucune offre ne correspond à la recherche.")).toHaveCount(0);
  });
});
