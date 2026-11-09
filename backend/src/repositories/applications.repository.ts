import type { Db } from "../db/database.ts";
import type { ApplicationDbo, ApplicationStatus } from "../models/application.ts";
import type { OfferStatus } from "../models/offer.ts";

interface InsertParams {
  offerId: number;
  studentId: number;
  message: string | null;
}

const APPLICATION_SELECT = `
  SELECT a.id, a.offer_id, o.title AS offer_title, c.short_name AS company_short_name,
         a.student_id, a.message, a.status, a.applied_at
  FROM applications a
  JOIN offers o ON o.id = a.offer_id
  JOIN companies c ON c.id = o.company_id
`;

export const createApplicationsRepository = (db: Db) => {
  const findOfferStatus = db.prepare<[number], { status: OfferStatus }>(
    "SELECT status FROM offers WHERE id = ?",
  );

  const findActive = db.prepare<{ studentId: number; offerId: number }, { id: number }>(
    `SELECT id FROM applications
     WHERE student_id = @studentId AND offer_id = @offerId AND status = 'IN_PROGRESS'`,
  );

  const insert = db.prepare<InsertParams, { id: number }>(
    `INSERT INTO applications (offer_id, student_id, message, status)
     VALUES (@offerId, @studentId, @message, 'IN_PROGRESS')
     RETURNING id`,
  );

  const findById = db.prepare<[number], ApplicationDbo>(`${APPLICATION_SELECT} WHERE a.id = ?`);

  const findByStudent = db.prepare<[number], ApplicationDbo>(
    `${APPLICATION_SELECT} WHERE a.student_id = ? ORDER BY a.applied_at DESC`,
  );

  const updateStatus = db.prepare<{ id: number; status: ApplicationStatus }, unknown>(
    "UPDATE applications SET status = @status WHERE id = @id",
  );

  return {
    /** Statut de l'offre visée, ou undefined si elle n'existe pas. */
    offerStatus: (offerId: number): OfferStatus | undefined => findOfferStatus.get(offerId)?.status,

    /** Vrai s'il existe déjà une candidature « En cours » de cet étudiant sur cette offre. */
    hasActiveApplication: (studentId: number, offerId: number): boolean =>
      findActive.get({ studentId, offerId }) !== undefined,

    insert: (params: InsertParams): ApplicationDbo => {
      const { id } = insert.get(params) as { id: number };
      return findById.get(id) as ApplicationDbo;
    },

    findById: (id: number): ApplicationDbo | undefined => findById.get(id),

    findByStudent: (studentId: number): ApplicationDbo[] => findByStudent.all(studentId),

    setStatus: (id: number, status: ApplicationStatus): ApplicationDbo => {
      updateStatus.run({ id, status });
      return findById.get(id) as ApplicationDbo;
    },
  };
};

export type ApplicationsRepository = ReturnType<typeof createApplicationsRepository>;
