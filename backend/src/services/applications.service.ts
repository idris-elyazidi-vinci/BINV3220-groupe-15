import { toApplication } from "../mappers/application.mapper.ts";
import type { Application } from "../models/application.ts";
import type { User } from "../models/user.ts";
import type { ApplicationsRepository } from "../repositories/applications.repository.ts";
import { HttpError } from "../utils/httpError.ts";

export const createApplicationsService = (repository: ApplicationsRepository) => ({
  /** Candidatures de l'étudiant connecté, de la plus récente à la plus ancienne (EF-33). */
  listOwn: (student: User): Application[] =>
    repository.findByStudent(student.id).map(toApplication),

  /**
   * Candidature d'un étudiant à une offre publiée (EF-32, RG-03). Une seule candidature
   * « En cours » par offre : après un retrait ou un refus, candidater à nouveau est permis.
   */
  apply: (student: User, offerId: number, message: string | null): Application => {
    const offerStatus = repository.offerStatus(offerId);
    if (offerStatus === undefined) {
      throw new HttpError(404, "OFFER_NOT_FOUND", "Cette offre n'existe pas");
    }
    if (offerStatus !== "PUBLISHED") {
      throw new HttpError(409, "OFFER_NOT_PUBLISHED", "On ne peut candidater qu'à une offre publiée");
    }
    if (repository.hasActiveApplication(student.id, offerId)) {
      throw new HttpError(409, "ALREADY_APPLIED", "Vous avez déjà une candidature en cours sur cette offre");
    }
    return toApplication(repository.insert({ offerId, studentId: student.id, message }));
  },

  /** Retrait d'une candidature « En cours » appartenant à l'étudiant (EF-32). */
  withdraw: (student: User, applicationId: number): Application => {
    const application = repository.findById(applicationId);
    if (application === undefined || application.student_id !== student.id) {
      throw new HttpError(404, "APPLICATION_NOT_FOUND", "Cette candidature n'existe pas");
    }
    if (application.status !== "IN_PROGRESS") {
      throw new HttpError(409, "APPLICATION_TREATED", "Cette candidature a déjà été traitée");
    }
    return toApplication(repository.setStatus(applicationId, "WITHDRAWN"));
  },
});

export type ApplicationsService = ReturnType<typeof createApplicationsService>;
