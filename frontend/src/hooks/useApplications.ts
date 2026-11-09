import { useCallback, useEffect, useState } from "react";
import type { Application } from "../models/application.ts";
import { getApplications } from "../services/applications.service.ts";
import { isUnauthorized } from "../utils/api.ts";

/**
 * Candidatures de l'étudiant connecté. `reload` force un rechargement après une action
 * (candidater, retirer). onUnauthorized doit être stable (useCallback). `enabled` permet
 * de ne rien charger pour un utilisateur qui n'est pas étudiant (l'API refuserait l'accès).
 */
export const useApplications = (token: string, onUnauthorized: () => void, enabled = true) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const load = () => {
      setIsLoading(true);
      setError(null);
      getApplications(token, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setApplications(data);
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
  }, [token, onUnauthorized, reloadKey, enabled]);

  return { applications, isLoading, error, reload };
};
