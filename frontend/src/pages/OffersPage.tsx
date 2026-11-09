import { useState } from "react";
import EmptyState from "../components/EmptyState.tsx";
import ErrorState from "../components/ErrorState.tsx";
import LoadingState from "../components/LoadingState.tsx";
import OfferTable from "../components/OfferTable.tsx";
import PeriodFilter, { type PeriodChoice } from "../components/PeriodFilter.tsx";
import { useApplications } from "../hooks/useApplications.ts";
import { useOffers } from "../hooks/useOffers.ts";
import type { Offer } from "../models/offer.ts";
import type { User } from "../models/user.ts";
import { applyToOffer } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";
import { isStudent } from "../utils/permissions.ts";

interface OffersPageProps {
  user: User;
  token: string;
  onUnauthorized: () => void;
}

const DESCRIPTIONS = {
  ADMIN: "Toutes les offres, tous statuts confondus.",
  STUDENT: "Les offres publiées.",
  CONTACT: "Les offres que vous avez déposées.",
} as const;

const OffersPage = ({ user, token, onUnauthorized }: OffersPageProps) => {
  const [period, setPeriod] = useState<PeriodChoice>("ALL");
  const { offers, isLoading, error } = useOffers(
    token,
    period === "ALL" ? undefined : period,
    onUnauthorized,
  );

  // Seul un étudiant candidate ; on charge ses candidatures pour griser les offres déjà visées.
  const canApply = isStudent(user);
  const { applications, reload: reloadApplications } = useApplications(
    token,
    onUnauthorized,
    canApply,
  );
  const activeOfferIds = new Set(
    applications.filter((application) => application.status === "IN_PROGRESS").map((a) => a.offerId),
  );

  const [applyingOfferId, setApplyingOfferId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const submitApply = (offerId: number) => {
    setPending(true);
    setApplyError(null);
    applyToOffer(token, offerId, message)
      .then(() => {
        setApplyingOfferId(null);
        setMessage("");
        reloadApplications();
      })
      .catch((reason: unknown) => {
        if (isUnauthorized(reason)) {
          onUnauthorized();
        } else {
          setApplyError(reason instanceof Error ? reason.message : "Candidature impossible");
        }
      })
      .finally(() => setPending(false));
  };

  const renderOfferAction = (offer: Offer) => {
    if (offer.status !== "PUBLISHED") return null;
    if (activeOfferIds.has(offer.id)) return <span className="muted">Déjà candidaté</span>;
    if (applyingOfferId === offer.id) {
      return (
        <div className="apply-form">
          <label>
            <span>Message (facultatif)</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          </label>
          <button type="button" onClick={() => submitApply(offer.id)} disabled={pending}>
            Envoyer ma candidature
          </button>
          <button
            type="button"
            onClick={() => {
              setApplyingOfferId(null);
              setMessage("");
            }}
            disabled={pending}
          >
            Annuler
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setApplyingOfferId(offer.id);
          setMessage("");
          setApplyError(null);
        }}
      >
        Candidater
      </button>
    );
  };

  const renderContent = () => {
    if (error) return <ErrorState message={error} />;
    if (isLoading) return <LoadingState />;
    if (offers.length === 0) return <EmptyState message="Aucune offre à afficher." />;
    return (
      <>
        <p className="result-count">
          {offers.length} offre{offers.length > 1 ? "s" : ""}
        </p>
        <OfferTable offers={offers} renderAction={canApply ? renderOfferAction : undefined} />
      </>
    );
  };

  return (
    <section>
      <h1>Offres de stage</h1>
      <p>{DESCRIPTIONS[user.kind]}</p>
      <PeriodFilter label="Filtrer par période" value={period} onChange={setPeriod} />
      {applyError !== null && <ErrorState message={applyError} />}
      {renderContent()}
    </section>
  );
};

export default OffersPage;
