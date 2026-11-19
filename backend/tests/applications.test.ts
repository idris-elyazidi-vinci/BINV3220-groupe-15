import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { ADMINISTRATOR, APPLICATION, CONTACT, OFFER, STUDENT } from "../src/db/seed/seedIds.ts";
import type { UserKind } from "../src/models/user.ts";
import { createTestApp, tokenFor } from "./helpers/testApp.ts";

let app: ReturnType<typeof createTestApp>;

beforeEach(() => {
  app = createTestApp();
});

const asStudent = (id: number) => tokenFor("STUDENT", id);

const applyAs = (token: string, body: object) =>
  request(app).post("/applications").set("Authorization", token).send(body);

const listAs = (token: string) =>
  request(app).get("/applications").set("Authorization", token);

const withdrawAs = (token: string, id: number) =>
  request(app).post(`/applications/${id}/withdrawal`).set("Authorization", token);

const offerIds = (body: { offerId: number }[]): number[] => body.map((a) => a.offerId);

describe("POST /applications : candidater (EF-32, RG-03)", () => {
  it("refuse une requête sans session (401)", async () => {
    const response = await request(app).post("/applications").send({ offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(401);
  });

  it.each([
    ["un administrateur", "ADMIN" as UserKind, ADMINISTRATOR.ANNE_LECLERCQ],
    ["un contact", "CONTACT" as UserKind, CONTACT.MARC_LEJEUNE],
  ])("refuse %s (403)", async (_who, kind, id) => {
    const response = await applyAs(tokenFor(kind, id), { offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(403);
  });

  it("enregistre la candidature d'un étudiant à une offre publiée, avec message", async () => {
    const token = asStudent(STUDENT.LOUIS_CLAES);

    const response = await applyAs(token, { offerId: OFFER.FLEET_APP, message: "Projet motivant" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      offerId: OFFER.FLEET_APP,
      message: "Projet motivant",
      status: "IN_PROGRESS",
    });

    const list = await listAs(token);
    expect(offerIds(list.body)).toContain(OFFER.FLEET_APP);
  });

  it("accepte une candidature sans message (message facultatif)", async () => {
    const response = await applyAs(asStudent(STUDENT.LOUIS_CLAES), { offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(201);
    expect(response.body.message).toBeNull();
  });

  it("refuse une candidature à une offre non publiée (RG-03, 409)", async () => {
    const response = await applyAs(asStudent(STUDENT.LOUIS_CLAES), {
      offerId: OFFER.CLIENT_PORTAL, // statut SUBMITTED
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED");
  });

  it("refuse une candidature à une offre inexistante (404)", async () => {
    const response = await applyAs(asStudent(STUDENT.LOUIS_CLAES), { offerId: 999 });

    expect(response.status).toBe(404);
  });

  it("refuse une deuxième candidature tant que la première est en cours (409)", async () => {
    // Lucas a déjà une candidature IN_PROGRESS sur FLEET_APP (seed).
    const response = await applyAs(asStudent(STUDENT.LUCAS_DUPONT), { offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ALREADY_APPLIED");
  });

  it("autorise une nouvelle candidature après un retrait (décision de groupe)", async () => {
    // Inès a une candidature WITHDRAWN sur BILLING_API (seed) : elle peut re-candidater.
    const response = await applyAs(asStudent(STUDENT.INES_HADDAD), { offerId: OFFER.BILLING_API });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
  });
});

describe("GET /applications : consulter ses candidatures (EF-33)", () => {
  it("ne renvoie que les candidatures de l'étudiant connecté", async () => {
    const response = await listAs(asStudent(STUDENT.INES_HADDAD));

    expect(response.status).toBe(200);
    expect(offerIds(response.body).sort()).toEqual([OFFER.FLEET_APP, OFFER.BILLING_API].sort());
  });

  it("expose le statut de chaque candidature", async () => {
    const response = await listAs(asStudent(STUDENT.LEA_MERTENS));

    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("REJECTED");
  });
});

describe("POST /applications/:id/withdrawal : retirer une candidature (EF-32)", () => {
  it("retire une candidature en cours de l'étudiant", async () => {
    const response = await withdrawAs(asStudent(STUDENT.LUCAS_DUPONT), APPLICATION.LUCAS_FLEET_APP);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("WITHDRAWN");
  });

  it("refuse de retirer une candidature déjà traitée (409)", async () => {
    // Mateusz : candidature SELECTED (traitée).
    const response = await withdrawAs(
      asStudent(STUDENT.MATEUSZ_KOWALSKI),
      APPLICATION.MATEUSZ_CLOUD_MIGRATION,
    );

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_TREATED");
  });

  it("refuse de retirer la candidature d'un autre étudiant (404)", async () => {
    // Lucas tente de retirer la candidature de Youssef.
    const response = await withdrawAs(
      asStudent(STUDENT.LUCAS_DUPONT),
      APPLICATION.YOUSSEF_BILLING_API,
    );

    expect(response.status).toBe(404);
  });

  it("permet de re-candidater après avoir retiré sa candidature", async () => {
    const token = asStudent(STUDENT.LUCAS_DUPONT);
    await withdrawAs(token, APPLICATION.LUCAS_FLEET_APP);

    const response = await applyAs(token, { offerId: OFFER.FLEET_APP });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("IN_PROGRESS");
  });
});

// ---------------------------------------------------------------------------
// Compléments de couverture (semaine 3 — audit du harnais, docs/semaine-3.md).
// Chaque test cible un manque relevé dans la matrice de traçabilité EF-32 / EF-33.
// ---------------------------------------------------------------------------

const statusOf = (body: { id: number; status: string }[], id: number) =>
  body.find((a) => a.id === id)?.status;

describe("EF-32 / RG-03 : seules les offres publiées acceptent une candidature", () => {
  it.each([
    ["en attente de validation", OFFER.E2E_TESTS], // PENDING
    ["attribuée", OFFER.CLOUD_MIGRATION], // ASSIGNED
    ["archivée", OFFER.PDF_REPORTS], // ARCHIVED
  ])("refuse une offre %s (409) sans créer de candidature", async (_label, offerId) => {
    const token = asStudent(STUDENT.LOUIS_CLAES);

    const response = await applyAs(token, { offerId });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("OFFER_NOT_PUBLISHED");
    const list = await listAs(token);
    expect(offerIds(list.body)).not.toContain(offerId);
  });

  it("ne crée aucune candidature en double quand la deuxième est refusée (409)", async () => {
    const token = asStudent(STUDENT.LUCAS_DUPONT);
    const before = await listAs(token);

    await applyAs(token, { offerId: OFFER.FLEET_APP });

    const after = await listAs(token);
    expect(after.body).toHaveLength(before.body.length);
  });

  it("rattache la candidature à l'étudiant connecté, pas à un studentId envoyé dans le corps", async () => {
    const response = await applyAs(asStudent(STUDENT.LOUIS_CLAES), {
      offerId: OFFER.DATA_QUALITY,
      studentId: STUDENT.LEA_MERTENS,
    });

    expect(response.status).toBe(201);
    const louis = await listAs(asStudent(STUDENT.LOUIS_CLAES));
    const lea = await listAs(asStudent(STUDENT.LEA_MERTENS));
    expect(offerIds(louis.body)).toContain(OFFER.DATA_QUALITY);
    expect(offerIds(lea.body)).not.toContain(OFFER.DATA_QUALITY);
  });

  it.each([
    ["offerId absent", {}],
    ["offerId non numérique", { offerId: "1" }],
    ["offerId non entier", { offerId: 1.5 }],
    ["message qui n'est pas une chaîne", { offerId: OFFER.FLEET_APP, message: 42 }],
    ["message trop long", { offerId: OFFER.FLEET_APP, message: "x".repeat(1001) }],
  ])("refuse un corps invalide : %s (400)", async (_label, body) => {
    const response = await applyAs(asStudent(STUDENT.LOUIS_CLAES), body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_BODY");
  });
});

describe("EF-32 : retrait d'une candidature — effets et refus", () => {
  it("enregistre le retrait : la liste de l'étudiant affiche ensuite « Retirée »", async () => {
    const token = asStudent(STUDENT.LUCAS_DUPONT);

    await withdrawAs(token, APPLICATION.LUCAS_FLEET_APP);

    const list = await listAs(token);
    expect(statusOf(list.body, APPLICATION.LUCAS_FLEET_APP)).toBe("WITHDRAWN");
  });

  it.each([
    ["non retenue", STUDENT.LEA_MERTENS, APPLICATION.LEA_CLOUD_MIGRATION, "REJECTED"],
    ["déjà retirée", STUDENT.INES_HADDAD, APPLICATION.INES_BILLING_API, "WITHDRAWN"],
  ])("refuse de retirer une candidature %s (409) et laisse son statut inchangé", async (_label, studentId, applicationId, status) => {
    const token = asStudent(studentId);

    const response = await withdrawAs(token, applicationId);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("APPLICATION_TREATED");
    const list = await listAs(token);
    expect(statusOf(list.body, applicationId)).toBe(status);
  });

  it("ne modifie pas la candidature d'un autre étudiant quand le retrait est refusé (404)", async () => {
    const response = await withdrawAs(
      asStudent(STUDENT.LUCAS_DUPONT),
      APPLICATION.YOUSSEF_BILLING_API,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");
    const youssef = await listAs(asStudent(STUDENT.YOUSSEF_EL_AMRANI));
    expect(statusOf(youssef.body, APPLICATION.YOUSSEF_BILLING_API)).toBe("IN_PROGRESS");
  });

  it("répond 404 pour une candidature inexistante", async () => {
    const response = await withdrawAs(asStudent(STUDENT.LUCAS_DUPONT), 999);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("APPLICATION_NOT_FOUND");
  });

  it("refuse un identifiant de candidature invalide (400)", async () => {
    const response = await request(app)
      .post("/applications/abc/withdrawal")
      .set("Authorization", asStudent(STUDENT.LUCAS_DUPONT));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_PARAM");
  });
});

describe("EF-32 / EF-33 : routes réservées aux étudiants", () => {
  it.each([
    ["GET /applications", () => request(app).get("/applications")],
    ["POST /applications/:id/withdrawal", () => request(app).post("/applications/1/withdrawal")],
  ])("%s refuse une requête sans session (401)", async (_route, send) => {
    const response = await send();

    expect(response.status).toBe(401);
  });

  it.each([
    ["un administrateur", "ADMIN" as UserKind, ADMINISTRATOR.ANNE_LECLERCQ],
    ["un contact", "CONTACT" as UserKind, CONTACT.MARC_LEJEUNE],
  ])("refuse à %s de consulter ou retirer des candidatures (403)", async (_who, kind, id) => {
    const token = tokenFor(kind, id);

    const list = await listAs(token);
    const withdrawal = await withdrawAs(token, APPLICATION.LUCAS_FLEET_APP);

    expect(list.status).toBe(403);
    expect(withdrawal.status).toBe(403);
    const lucas = await listAs(asStudent(STUDENT.LUCAS_DUPONT));
    expect(statusOf(lucas.body, APPLICATION.LUCAS_FLEET_APP)).toBe("IN_PROGRESS");
  });
});

describe("EF-33 : chaque statut de candidature est exposé", () => {
  it("expose « En cours » et « Retirée » pour les candidatures d'un même étudiant", async () => {
    const response = await listAs(asStudent(STUDENT.INES_HADDAD));

    expect(statusOf(response.body, APPLICATION.INES_FLEET_APP)).toBe("IN_PROGRESS");
    expect(statusOf(response.body, APPLICATION.INES_BILLING_API)).toBe("WITHDRAWN");
  });

  it("expose « Retenue » pour une candidature sélectionnée", async () => {
    const response = await listAs(asStudent(STUDENT.MATEUSZ_KOWALSKI));

    expect(statusOf(response.body, APPLICATION.MATEUSZ_CLOUD_MIGRATION)).toBe("SELECTED");
  });

  it("renvoie une liste vide pour un étudiant sans candidature", async () => {
    const response = await listAs(asStudent(STUDENT.DMYTRO_KOVALENKO));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("indique l'offre visée (titre et entreprise) pour chaque candidature", async () => {
    const response = await listAs(asStudent(STUDENT.LEA_MERTENS));

    expect(response.body[0]).toMatchObject({
      offerId: OFFER.CLOUD_MIGRATION,
      offerTitle: expect.any(String),
      companyShortName: expect.any(String),
    });
    expect(response.body[0].offerTitle).not.toBe("");
  });
});
