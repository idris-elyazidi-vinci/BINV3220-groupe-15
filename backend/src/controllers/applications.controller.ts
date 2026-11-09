import { Router } from "express";
import { toApplicationDto } from "../mappers/application.mapper.ts";
import { getCurrentUser } from "../middlewares/authenticate.ts";
import { authorize } from "../middlewares/authorize.ts";
import type { ApplicationsService } from "../services/applications.service.ts";
import { isStudent } from "../services/permissions.ts";
import { HttpError } from "../utils/httpError.ts";

const MAX_MESSAGE_LENGTH = 1000;

/** Identifiant d'offre du corps : entier strictement positif obligatoire. */
const parseOfferId = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new HttpError(400, "INVALID_BODY", "offerId doit être un identifiant d'offre valide");
  }
  return value;
};

/** Message facultatif : chaîne (vide ou absente = pas de message). */
const parseMessage = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new HttpError(400, "INVALID_BODY", "message doit être une chaîne de caractères");
  }
  if (value.length > MAX_MESSAGE_LENGTH) {
    throw new HttpError(400, "INVALID_BODY", `message ne peut pas dépasser ${MAX_MESSAGE_LENGTH} caractères`);
  }
  const message = value.trim();
  return message === "" ? null : message;
};

/** Identifiant de candidature dans l'URL : entier strictement positif. */
const parseApplicationId = (value: string): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "INVALID_PARAM", "Identifiant de candidature invalide");
  }
  return id;
};

export const createApplicationsRouter = (applicationsService: ApplicationsService) => {
  const router = Router();

  // Toutes les candidatures sont réservées aux étudiants (EF-32, EF-33).
  router.use(authorize(isStudent));

  router.get("/", (req, res) => {
    res.json(applicationsService.listOwn(getCurrentUser(req)).map(toApplicationDto));
  });

  router.post("/", (req, res) => {
    const offerId = parseOfferId((req.body as Record<string, unknown>).offerId);
    const message = parseMessage((req.body as Record<string, unknown>).message);
    const application = applicationsService.apply(getCurrentUser(req), offerId, message);
    res.status(201).json(toApplicationDto(application));
  });

  router.post("/:id/withdrawal", (req, res) => {
    const applicationId = parseApplicationId(req.params.id);
    const application = applicationsService.withdraw(getCurrentUser(req), applicationId);
    res.json(toApplicationDto(application));
  });

  return router;
};
