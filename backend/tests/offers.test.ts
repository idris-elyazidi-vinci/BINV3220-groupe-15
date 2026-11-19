import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const listOffersAs = (kind: UserKind, id: number, query = "") =>
  request(app).get(`/offers${query}`).set("Authorization", tokenFor(kind, id));

const offerIds = (body: { id: number }[]): number[] => body.map((offer) => offer.id);

describe("GET /offers : accès", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).get("/offers");

    expect(response.status).toBe(401);
  });

  it.each([
    ["promoteur et signataire", CONTACT.NADIA_CHERIF],
    ["signataire uniquement", CONTACT.NATHALIE_RENARD],
    ["promoteur uniquement", CONTACT.LAURA_SIMON],
  ])("refuse un contact %s (403)", async (_profile, id) => {
    const response = await listOffersAs("CONTACT", id);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});

describe("GET /offers : visibilité selon le profil", () => {
  it("montre toutes les offres à un administrateur, de la plus récente année à la plus ancienne", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body.at(-1)).toEqual({
      id: OFFER.PDF_REPORTS,
      title: "Module de rapports PDF",
      companyShortName: "Orbis",
      academicYear: "2025-2026",
      period: "P1",
      status: "ARCHIVED",
    });
  });

  it("ne montre que les offres publiées à un étudiant", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT);

    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
    expect(response.body.every((o: { status: string }) => o.status === "PUBLISHED")).toBe(true);
  });

  it("montre à un déposant toutes ses offres, quel que soit leur statut", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.MARC_LEJEUNE);

    expect(offerIds(response.body)).toEqual([
      OFFER.E2E_TESTS,
      OFFER.BILLING_API,
      OFFER.PDF_REPORTS,
    ]);
  });

  it("ne montre pas à un déposant l'offre d'un collègue de la même entreprise", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.CLAIRE_DUMONT);

    expect(offerIds(response.body)).toEqual([OFFER.FLEET_APP]);
    expect(offerIds(response.body)).not.toContain(OFFER.CLIENT_PORTAL);
  });

  it("montre à un contact multi-entreprises ses offres dans ses deux entreprises", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.JULIEN_LAMBERT);

    expect(response.body.map((o: { companyShortName: string }) => o.companyShortName)).toEqual([
      "Lumen Digital",
      "Lumen Data",
    ]);
    expect(offerIds(response.body)).toEqual([OFFER.CLIENT_PORTAL, OFFER.DATA_QUALITY]);
  });

  it("n'expose que les champs du DTO", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ);

    expect(Object.keys(response.body[0]).sort()).toEqual(
      ["academicYear", "companyShortName", "id", "period", "status", "title"],
    );
  });
});

describe("GET /offers : filtre par période", () => {
  it("ne garde que les offres de la période P1 pour un administrateur", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?period=P1");

    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.PDF_REPORTS]);
    expect(response.body.every((o: { period: string }) => o.period === "P1")).toBe(true);
  });

  it("ne garde que les offres de la période OTHER pour un administrateur", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?period=OTHER");

    expect(offerIds(response.body)).toEqual([OFFER.CONSULTANT_PLANNING, OFFER.E2E_TESTS]);
  });

  it("combine le filtre de période avec la visibilité : l'étudiant ne voit que ses offres publiées en P2", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT, "?period=P2");

    expect(offerIds(response.body)).toEqual([
      OFFER.INTERNAL_CHATBOT,
      OFFER.DATA_QUALITY,
      OFFER.FLEET_APP,
      OFFER.BILLING_API,
    ]);
  });

  it("n'expose pas via le filtre une offre hors de la visibilité du profil (P1 archivée pour un étudiant)", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT, "?period=P1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("rejette une valeur de période inconnue (400)", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?period=P3");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });
});

describe("GET /offers : recherche par mot-clé dans le titre (EF-30)", () => {
  it("ne garde que les offres dont le titre contient le texte, sans tenir compte de la casse", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=api");

    // « API REST de facturation » (casse différente) et « Numérisation d'archives papier ».
    expect(response.status).toBe(200);
    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API, OFFER.ARCHIVE_DIGITIZATION]);
  });

  it("ignore les espaces au début et à la fin de la recherche", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=%20%20api%20");

    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API, OFFER.ARCHIVE_DIGITIZATION]);
  });

  it.each([
    ["vide", "?q="],
    ["faite uniquement d'espaces", "?q=%20%20%20"],
  ])("renvoie toutes les offres accessibles pour une recherche %s", async (_cas, query) => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, query);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
  });

  it("renvoie une liste vide quand aucun titre ne correspond", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=blockchain");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("cherche l'expression entière quand la recherche contient plusieurs mots", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=tableau%20de%20bord");

    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALITY]);
  });

  it("ne trouve rien quand les mots sont dans un autre ordre que dans le titre", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=bord%20tableau");

    expect(response.body).toEqual([]);
  });

  it("traite % comme un caractère ordinaire et non comme un joker", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=%25");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("combine la recherche avec le filtre de période", async () => {
    const response = await listOffersAs(
      "ADMIN",
      ADMINISTRATOR.ANNE_LECLERCQ,
      "?q=de&period=P2",
    );

    // « de » apparaît aussi dans deux offres OTHER et une offre P1, exclues par la période ;
    // les autres offres P2 sont exclues par la recherche.
    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALITY, OFFER.FLEET_APP, OFFER.BILLING_API]);
  });

  it("n'expose pas à un étudiant une offre non publiée dont le titre correspond", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT, "?q=portail");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("ne montre à un étudiant que les offres publiées qui correspondent", async () => {
    const response = await listOffersAs("STUDENT", STUDENT.LUCAS_DUPONT, "?q=de");

    // « de » apparaît aussi dans trois offres non publiées (SUBMITTED, PENDING, ARCHIVED).
    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALITY, OFFER.FLEET_APP, OFFER.BILLING_API]);
  });

  it("n'expose pas à un déposant l'offre d'un collègue dont le titre correspond", async () => {
    const response = await listOffersAs("CONTACT", CONTACT.CLAIRE_DUMONT, "?q=portail");

    expect(response.body).toEqual([]);
  });

  it("rejette un paramètre q répété (400)", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, "?q=api&q=pdf");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });

  it("rejette une recherche de plus de 100 caractères (400)", async () => {
    const response = await listOffersAs("ADMIN", ADMINISTRATOR.ANNE_LECLERCQ, `?q=${"a".repeat(101)}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_QUERY");
  });
});
