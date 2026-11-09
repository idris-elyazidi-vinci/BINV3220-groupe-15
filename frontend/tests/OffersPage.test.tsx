import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OffersPage from "../src/pages/OffersPage.tsx";
import { adminUser, contactUser, stubFetch, studentUser } from "./helpers/fetchMock.ts";

const offers = [
  {
    id: 2,
    title: "Refonte du portail client",
    companyShortName: "Lumen Digital",
    academicYear: "2026-2027",
    period: "P2",
    status: "SUBMITTED",
  },
  {
    id: 5,
    title: "Tableau de bord de qualité des données",
    companyShortName: "Lumen Data",
    academicYear: "2026-2027",
    period: "OTHER",
    status: "ASSIGNED",
  },
];

describe("OffersPage", () => {
  it("affiche les offres avec leurs libellés français", async () => {
    stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByText("Refonte du portail client")).toBeInTheDocument();
    expect(screen.getByText("Soumise")).toBeInTheDocument();
    expect(screen.getByText("Attribuée")).toBeInTheDocument();
    // « Autre » est aussi une option du filtre : on cible la cellule du tableau.
    expect(within(screen.getByRole("table")).getByText("Autre")).toBeInTheDocument();
    expect(screen.getByText("2 offres")).toBeInTheDocument();
    expect(screen.getByText("Les offres que vous avez déposées.")).toBeInTheDocument();
  });

  it("adapte la description au profil", async () => {
    stubFetch({
      "/api/applications": () => Response.json([]),
      "/api/offers": () => Response.json([]),
    });

    const { unmount } = render(
      <OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />,
    );
    expect(screen.getByText("Les offres publiées.")).toBeInTheDocument();
    expect(await screen.findByText("Aucune offre à afficher.")).toBeInTheDocument();
    unmount();

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    expect(screen.getByText("Toutes les offres, tous statuts confondus.")).toBeInTheDocument();
  });

  it("affiche un refus d'accès renvoyé par le backend", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 403 }) });

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("statut 403");
  });

  it("signale une session expirée", async () => {
    stubFetch({ "/api/offers": () => new Response(null, { status: 401 }) });
    const onUnauthorized = vi.fn();

    render(<OffersPage user={contactUser} token="jeton" onUnauthorized={onUnauthorized} />);

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it("charge toutes les périodes au premier affichage", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");

    expect(fetchMock).toHaveBeenCalledWith("/api/offers", expect.anything());
  });

  it("transmet la période choisie à l'API", async () => {
    const fetchMock = stubFetch({ "/api/offers": () => Response.json(offers) });

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Refonte du portail client");

    fireEvent.change(screen.getByLabelText("Filtrer par période"), { target: { value: "P1" } });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith("/api/offers?period=P1", expect.anything()),
    );
  });
});

const publishedOffer = {
  id: 1,
  title: "Application React de gestion de flotte",
  companyShortName: "Lumen Digital",
  academicYear: "2026-2027",
  period: "P2",
  status: "PUBLISHED",
};

describe("OffersPage — candidater (EF-32)", () => {
  it("permet à un étudiant de candidater à une offre publiée, avec message", async () => {
    const fetchMock = stubFetch({
      "/api/applications": () => Response.json([]),
      "/api/offers": () => Response.json([publishedOffer]),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Application React de gestion de flotte");

    fireEvent.click(screen.getByRole("button", { name: "Candidater" }));
    fireEvent.change(screen.getByLabelText("Message (facultatif)"), {
      target: { value: "Ce projet m'intéresse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer ma candidature" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/applications",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("indique « Déjà candidaté » quand une candidature est en cours", async () => {
    stubFetch({
      "/api/applications": () =>
        Response.json([
          {
            id: 1,
            offerId: 1,
            offerTitle: "Application React de gestion de flotte",
            companyShortName: "Lumen Digital",
            message: null,
            status: "IN_PROGRESS",
            appliedAt: "2026-10-02 18:10:00",
          },
        ]),
      "/api/offers": () => Response.json([publishedOffer]),
    });

    render(<OffersPage user={studentUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Application React de gestion de flotte");

    expect(screen.getByText("Déjà candidaté")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
  });

  it("ne propose pas de candidater à un administrateur", async () => {
    stubFetch({ "/api/offers": () => Response.json([publishedOffer]) });

    render(<OffersPage user={adminUser} token="jeton" onUnauthorized={vi.fn()} />);
    await screen.findByText("Application React de gestion de flotte");

    expect(screen.queryByRole("button", { name: "Candidater" })).not.toBeInTheDocument();
  });
});
