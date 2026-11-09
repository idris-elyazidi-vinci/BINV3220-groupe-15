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
