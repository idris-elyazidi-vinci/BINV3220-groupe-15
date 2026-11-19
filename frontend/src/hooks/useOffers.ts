import { useEffect, useState } from "react";
import type { Offer, PeriodCode } from "../models/offer.ts";
import { getOffers } from "../services/offers.service.ts";
import { isUnauthorized } from "../utils/api.ts";

// Délai avant d'interroger l'API pendant la frappe d'une recherche.
const SEARCH_DELAY_MS = 300;

/**
 * Offres visibles par l'utilisateur, choisies par le backend selon son profil et
 * éventuellement restreintes à une période et à un texte cherché dans le titre. Un changement
 * de période relance le chargement ; une recherche le relance après le délai de frappe.
 * Les espaces autour de la recherche sont ignorés : une recherche vide ne relance rien.
 * onUnauthorized doit être stable (useCallback) pour ne pas relancer inutilement le chargement.
 */
export const useOffers = (
  token: string,
  period: PeriodCode | undefined,
  search: string,
  onUnauthorized: () => void,
) => {
  const trimmedSearch = search.trim();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = () => {
      setIsLoading(true);
      setError(null);
      getOffers(token, period, trimmedSearch, controller.signal)
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

    const timeoutId = window.setTimeout(load, trimmedSearch === "" ? 0 : SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [token, period, trimmedSearch, onUnauthorized]);

  return { offers, isLoading, error };
};
