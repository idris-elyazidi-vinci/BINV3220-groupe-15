import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ApplicationsPage from "../src/pages/ApplicationsPage.tsx";
import { stubFetch } from "./helpers/fetchMock.ts";

const applications = [
  {
    id: 1,
    offerId: 1,
    offerTitle: "Application React de gestion de flotte",
    companyShortName: "Lumen Digital",
    message: null,
    status: "IN_PROGRESS",
    appliedAt: "2026-10-02 18:10:00",
  },
  {
    id: 5,
    offerId: 3,
    offerTitle: "API REST de facturation",
    companyShortName: "Orbis",
    message: "Candidature retirée",
    status: "WITHDRAWN",
    appliedAt: "2026-09-30 10:30:00",
  },
];

describe("ApplicationsPage", () => {
  it("affiche les candidatures avec leur statut en français", async () => {
    stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(
      await screen.findByText("Application React de gestion de flotte"),
    ).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getByText("Retirée")).toBeInTheDocument();
  });

  it("ne propose le retrait que pour une candidature en cours", async () => {
    stubFetch({ "/api/applications": () => Response.json(applications) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Application React de gestion de flotte");

    expect(screen.getAllByRole("button", { name: "Retirer" })).toHaveLength(1);
  });

  it("retire une candidature en cours via l'API", async () => {
    const fetchMock = stubFetch({
      "/api/applications/1/withdrawal": () =>
        Response.json({ ...applications[0], status: "WITHDRAWN" }),
      "/api/applications": () => Response.json(applications),
    });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Application React de gestion de flotte");

    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/applications/1/withdrawal",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("affiche un état vide sans candidature", async () => {
    stubFetch({ "/api/applications": () => Response.json([]) });

    render(<ApplicationsPage token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Vous n'avez aucune candidature.")).toBeInTheDocument();
  });
});
