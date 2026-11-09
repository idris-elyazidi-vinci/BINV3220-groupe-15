import { useEffect, useState } from "react";
import type { Offer, PeriodCode } from "../models/offer.ts";
import { getOffers } from "../services/offers.service.ts";
import { isUnauthorized } from "../utils/api.ts";

/**
 * Offres visibles par l'utilisateur, choisies par le backend selon son profil et
 * éventuellement restreintes à une période. Un changement de période relance le chargement.
 * onUnauthorized doit être stable (useCallback) pour ne pas relancer inutilement le chargement.
 */
export const useOffers = (
  token: string,
  period: PeriodCode | undefined,
  onUnauthorized: () => void,
) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = () => {
      setIsLoading(true);
      setError(null);
      getOffers(token, period, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setOffers(data);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted) return;
          if (isUnauthorized(reason)) {
            onUnauthorized();
          } else {
            setError(reason instanceof Error ? reason.message : "Erreur inconnue");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    };

    const timeoutId = window.setTimeout(load, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, period, onUnauthorized]);

  return { offers, isLoading, error };
};
