import { useState } from "react";
import ApplicationTable from "../components/ApplicationTable.tsx";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { withdrawApplication } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

interface ApplicationsPageProps {
  token: string;
  onUnauthorized: () => void;
}

const ApplicationsPage = ({ token, onUnauthorized }: ApplicationsPageProps) => {
  const { applications, isLoading, error, reload } = useApplications(token, onUnauthorized);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleWithdraw = (id: number) => {
    setPendingId(id);
    setActionError(null);
    withdrawApplication(token, id)
      .then(() => reload())
      .catch((reason: unknown) => {
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setActionError(reason instanceof Error ? reason.message : "Retrait impossible");
        }
      })
      .finally(() => setPendingId(null));
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading && applications.length === 0) return <LoadingState />;
    if (applications.length === 0) {
      return <EmptyState message="Vous n'avez aucune candidature." />;
    }
    return (
      <>
        <p className="result-count">
          {applications.length} candidature{applications.length > 1 ? "s" : ""}
        </p>
        <ApplicationTable
          applications={applications}
          onWithdraw={handleWithdraw}
          pendingId={pendingId}
        />
      </>
    );
  };

  return (
    <section>
      <h1>Mes candidatures</h1>
      <p>Vos candidatures et leur statut.</p>
      {actionError !== null && <ErrorState message={actionError} />}
      {renderContent()}
    </section>
  );
};

export default ApplicationsPage;
