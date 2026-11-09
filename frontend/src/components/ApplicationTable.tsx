import type { Application } from "../models/application.ts";
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_TONES } from "../utils/labels.ts";
import StatusBadge from "./StatusBadge.tsx";

interface ApplicationTableProps {
  applications: Application[];
  onWithdraw: (id: number) => void;
  pendingId: number | null;
}

const ApplicationTable = ({ applications, onWithdraw, pendingId }: ApplicationTableProps) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Offre</th>
          <th scope="col">Entreprise</th>
          <th scope="col">Message</th>
          <th scope="col">Statut</th>
          <th scope="col">Action</th>
        </tr>
      </thead>
      <tbody>
        {applications.map((application) => (
          <tr key={application.id}>
            <td>{application.offerTitle}</td>
            <td>{application.companyShortName}</td>
            <td>{application.message ?? "—"}</td>
            <td>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[application.status]}
                tone={APPLICATION_STATUS_TONES[application.status]}
              />
            </td>
            <td>
              {application.status === "IN_PROGRESS" && (
                <button
                  type="button"
                  onClick={() => onWithdraw(application.id)}
                  disabled={pendingId === application.id}
                >
                  Retirer
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ApplicationTable;
