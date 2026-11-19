> Export de session Claude Code (`/export`) — recherche EF-30 en TDD, essai 2.
> Trace non résumée, telle qu'affichée dans le terminal.

```text
 ▐▛███▛█   Claude Code v2.1.328
▝▜██████▀  Opus 5.5 · Claude Pro
 ▝▝   ▝▝   ~/etudes/ia-agentique/BINV3220-groupe-15


❯  Ajoute une recherche d'offres par mot-clé sur le titre (EF-30) : texte       
  contenu dans le titre, insensible à la casse ; ignorer les espaces au début   
  et à la fin ; recherche vide → les offres normalement accessibles ; aucune    
  correspondance → liste vide et message adapté ; combinable avec le filtre par 
  période ; conserver les règles de visibilité (un étudiant ne voit que les     
  offres publiées) ; plusieurs mots → l'expression entière ; accents et         
  recherche approximative hors périmètre.                                       

  Read 1 file, ran 1 shell command, no result recorded for 1 other call (ctrl+o to expand)
  ⎿  $ cat backend/src/controllers/offers.controller.ts backend/src/services/offers.service.ts backend/src/repositories/offers.repository.ts backend/src/controllers/companies.controller.ts backend/src/repositories/companies.repository.ts; cat .github/skills/test-driven-development/writing-good-tests.md;…
  ⎿  Interrupted · What should Claude do instead?
  ⎿  Interrupted · What should Claude do instead?

❯ reprend                                                                       

  Searched for 1 pattern, ran 1 shell command (ctrl+o to expand)

⏺ Now the offer titles in the seed and the frontend offers page.

  Searched for 2 patterns, ran 1 shell command (ctrl+o to expand)

⏺ Je suis le patron du filtre ?q= des entreprises (paramètre q, trim, 100
  caractères max, échappement des jokers LIKE). J'écris d'abord les tests.

⏺ Bash(cat >> backend/tests/offers.test.ts <<'EOF'…)
  ⎿       × ne garde que les offres dont le titre contient le texte, sans t
     enir compte de la casse 5ms
          × ignore les espaces au début et à la fin de la recherche 4ms
     … +46 lines (ctrl+o to expand)
  ⎿  Updated backend/tests/offers.test.ts +97
      138      expect(response.body.error.code).toBe("INVALID_QUERY");
      139    });
      140  });
      141 +                                                              
      142 +describe("GET /offers : recherche par mot-clé dans le titre (E
          +F-30)", () => {                                               
      143 +  it("ne garde que les offres dont le titre contient le texte,
          + sans tenir compte de la casse", async () => {                
      144 +    const response = await listOffersAs("ADMIN", ADMINISTRATOR
          +.ANNE_LECLERCQ, "?q=api");                                    
      145 +                                                              
      146 +    expect(response.status).toBe(200);                        
      147 +    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          +]);                                                           
      148 +  });                                                         
      149 +                                                              
      150 +  it("ignore les espaces au début et à la fin de la recherche"
          +, async () => {                                               
      151 +    const response = await listOffersAs("ADMIN", ADMINISTRATOR
          +.ANNE_LECLERCQ, "?q=%20%20api%20");                           
      152 +                                                              
      153 +    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          +]);                                                           
      154 +  });                                                         
      155 +                                                              
      156 +  it.each([                                                   
      157 +    ["vide", "?q="],                                          
      158 +    ["faite uniquement d'espaces", "?q=%20%20%20"],           
      159 +  ])("renvoie toutes les offres accessibles pour une recherche
          + %s", async (_cas, query) => {                                
      160 +    const response = await listOffersAs("ADMIN", ADMINISTRATOR
          +.ANNE_LECLERCQ, query);                                       
      161 +                                                              
      162 +    expect(response.status).toBe(200);                        
      163 +    expect(response.body).toHaveLength(10);                   
      164 +  });                                                         
      165 +                                                              
      166 +  it("renvoie une liste vide quand aucun titre ne correspond",
          + async () => {                                                
      167 +    const response = await listOffersAs("ADMIN", ADMINISTRATOR
          +.ANNE_LECLERCQ, "?q=blockchain");                             
      168 +                                                              
      169 +    expect(response.status).toBe(200);                        
      170 +    expect(response.body).toEqual([]);                        
      171 +  });                                                         
      172 +                                                              
      173 +  it("cherche l'expression entière quand la recherche contient
          + plusieurs mots", async () => {                               
      174 +    const response = await listOffersAs("ADMIN", ADMINISTRATOR
          +.ANNE_LECLERCQ, "?q=tableau%20de%20bord");                    
      175 +                                                              
      176 +    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALIT
          +Y]);                                                          
      177 +  });                                                         
     … +60 lines (ctrl+o to expand)
  ⎿  Updated frontend/tests/OffersPage.test.tsx +69
      160      expect(screen.queryByRole("button", { name: "Candidater" }
           )).not.toBeInTheDocument();
      161    });
      162  });
      163 +                                                              
      164 +describe("OffersPage — recherche par titre (EF-30)", () => {  
      165 +  it("transmet le texte saisi à l'API, sans les espaces au déb
          +ut et à la fin", async () => {                                
      166 +    const fetchMock = stubFetch({ "/api/offers": () => Respons
          +e.json(offers) });                                            
      167 +                                                              
      168 +    render(<OffersPage user={adminUser} token="jeton" onUnauth
          +orized={vi.fn()} />);                                         
      169 +    await screen.findByText("Refonte du portail client");     
      170 +                                                              
      171 +    fireEvent.change(screen.getByLabelText("Rechercher par tit
          +re"), {                                                       
      172 +      target: { value: "  portail client " },                 
      173 +    });                                                       
      174 +                                                              
      175 +    await waitFor(() =>                                       
      176 +      expect(fetchMock).toHaveBeenLastCalledWith(             
      177 +        "/api/offers?q=portail+client",                       
      178 +        expect.anything(),                                    
      179 +      ),                                                      
      180 +    );                                                        
      181 +  });                                                         
      182 +                                                              
      183 +  it("n'envoie pas de paramètre q pour une recherche faite uni
          +quement d'espaces", async () => {                             
      184 +    const fetchMock = stubFetch({ "/api/offers": () => Respons
          +e.json(offers) });                                            
      185 +                                                              
      186 +    render(<OffersPage user={adminUser} token="jeton" onUnauth
          +orized={vi.fn()} />);                                         
      187 +    await screen.findByText("Refonte du portail client");     
      188 +                                                              
      189 +    fireEvent.change(screen.getByLabelText("Rechercher par tit
          +re"), { target: { value: "   " } });                          
      190 +                                                              
      191 +    await waitFor(() =>                                       
      192 +      expect(fetchMock).toHaveBeenLastCalledWith("/api/offers"
          +, expect.anything()),                                         
      193 +    );                                                        
      194 +    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringCo
          +ntaining("q="), expect.anything());                           
      195 +  });                                                         
      196 +                                                              
      197 +  it("combine la recherche avec la période choisie", async () 
          +=> {                                                          
      198 +    const fetchMock = stubFetch({ "/api/offers": () => Respons
          +e.json(offers) });                                            
      199 +                                                              
     … +32 lines (ctrl+o to expand)

⏺ Le test de combinaison passait déjà sans les deux filtres, donc il ne prouvait
  rien. Je le remplace par un cas où chaque filtre retire réellement des
  offres. · summary

⏺ Bash(python3 - <<'EOF'
      p="backend/tests/offers.test.ts"…)
  ⎿       × combine la recherche avec le filtre de période 2ms
     ⎯⎯⎯⎯⎯⎯ Failed Tests 12 ⎯⎯⎯⎯⎯⎯⎯
      FAIL  tests/offers.test.ts > GET /offers : recherche par mot-clé dans
     … +15 lines (ctrl+o to expand)
  ⎿  Updated backend/tests/offers.test.ts +5 -5
      193      const response = await listOffersAs(
      194        "ADMIN",
      195        ADMINISTRATOR.ANNE_LECLERCQ,
      196 -      "?q=des&period=OTHER",                                  
      196 +      "?q=de&period=P2",                                      
      197      );
      198 
      199 -    // « Tableau de bord de qualité des données » contient « d
          -es » mais est en P2 : exclue.                                 
      200 -    expect(offerIds(response.body)).toEqual([OFFER.CONSULTANT_
          -PLANNING, OFFER.E2E_TESTS]);                                  
      199 +    // « de » apparaît aussi dans deux offres OTHER et une off
          +re P1, exclues par la période ;                               
      200 +    // les autres offres P2 sont exclues par la recherche.    
      201 +    expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALIT
          +Y, OFFER.FLEET_APP, OFFER.BILLING_API]);                      
      202    });
      203 
      204    it("n'expose pas à un étudiant une offre non publiée dont le
            titre correspond", async () => {
     ...
      211    it("ne montre à un étudiant que les offres publiées qui corr
           espondent", async () => {
      212      const response = await listOffersAs("STUDENT", STUDENT.LUC
           AS_DUPONT, "?q=de");
      213 
      213 -    // « Automatisation des tests de bout en bout » (PENDING) 
          -et « Module de rapports PDF »                                 
      214 -    // (ARCHIVED) contiennent aussi « de » mais ne sont pas pu
          -bliées.                                                       
      214 +    // « de » apparaît aussi dans trois offres non publiées (S
          +UBMITTED, PENDING, ARCHIVED).                                 
      215      expect(offerIds(response.body)).toEqual([OFFER.DATA_QUALIT
           Y, OFFER.FLEET_APP, OFFER.BILLING_API]);
      216    });
      217 

⏺ J'ai écrit les tests et je les ai lancés. Aucun code de l'application n'a été
  modifié : j'attends ta validation avant d'implémenter.

  Choix faits en reprenant la recherche des entreprises

  - Le paramètre s'appelle GET /offers?q=…. Il est validé dans le controller :
    les espaces au début et à la fin sont retirés, une recherche vide est
    ignorée, 100 caractères au maximum, et 400 INVALID_QUERY si le paramètre est
    répété ou trop long.
  - La recherche se fait côté serveur, avec LIKE '%…%' en échappant %, _ et \.
    Elle s'ajoute au filtre de visibilité et au filtre de période, elle ne les
    remplace pas.
  - Côté front, le champ s'appelle « Rechercher par titre ». Si une recherche ne
    donne rien, la page affiche « Aucune offre ne correspond à la recherche. »
    ; sans recherche, le message reste « Aucune offre à afficher. ».

  Tests backend (backend/tests/offers.test.ts, 14 cas) : 12 échouent, 2 passent

  ┌─────────────────────────────┬──────────────────────────┬────────────────┐
  │            Test             │         Attendu          │    Observé     │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=api (sans tenir compte   │ [BILLING_API]            │ les 10 offres  │
  │ de la casse)                │                          │ ❌             │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=%20%20api%20 (espaces    │ [BILLING_API]            │ les 10 ❌      │
  │ ignorés)                    │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=blockchain               │ []                       │ les 10 ❌      │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=tableau de bord          │ [DATA_QUALITY]           │ les 10 ❌      │
  │ (l'expression entière)      │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=bord tableau (autre      │ []                       │ les 10 ❌      │
  │ ordre des mots)             │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=% (pris tel quel, pas    │ []                       │ les 10 ❌      │
  │ comme joker)                │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=de&period=P2             │ [DATA_QUALITY,           │ les 4 offres   │
  │                             │ FLEET_APP, BILLING_API]  │ P2 ❌          │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ Étudiant, ?q=portail (offre │ []                       │ 4 offres ❌    │
  │  non publiée)               │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ Étudiant, ?q=de             │ [5, 1, 3]                │ [7, 5, 1, 3]   │
  │                             │                          │ ❌             │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ Déposant, ?q=portail (offre │ []                       │ [FLEET_APP] ❌ │
  │  d'un collègue)             │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q=api&q=pdf / 101          │ 400                      │ 200 ❌         │
  │ caractères                  │                          │                │
  ├─────────────────────────────┼──────────────────────────┼────────────────┤
  │ ?q= / ?q=%20%20%20          │ les 10 offres            │ les 10 ✅      │
  └─────────────────────────────┴──────────────────────────┴────────────────┘

  Pourquoi 2 tests passent déjà : aujourd'hui, l'API ignore complètement q. Les
  deux cas « recherche vide » passent donc dès maintenant. Ils servent de
  garde-fou : ils échoueront si l'implémentation filtre par erreur quand la
  recherche est vide.

  Une correction en cours de route : ma première version du test de combinaison
  utilisait ?q=des&period=OTHER. Il passait sans aucune implémentation, parce
  que OTHER donne déjà exactement ces deux offres : il ne prouvait rien. Je l'ai
  remplacé par ?q=de&period=P2. Dans ce cas, la période retire 3 offres qui
  contiennent « de » et la recherche retire 3 offres P2.

  Tests frontend (frontend/tests/OffersPage.test.tsx, 4 cas) : 4 échouent

  Les 4 échouent avec Unable to find a label with the text of: Rechercher par 
  titre, c'est-à-dire parce que la fonctionnalité n'existe pas encore :
  1. le texte saisi est envoyé sans les espaces autour : "  portail client "
     donne /api/offers?q=portail+client ;
  2. une recherche faite uniquement d'espaces n'ajoute pas de q à l'appel ;
  3. la recherche se combine avec la période : /api/offers?period=P2&q=api (j'ai
     choisi cet ordre des paramètres) ;
  4. le message adapté s'affiche quand rien ne correspond.

  Les autres tests existants de ces deux fichiers passent toujours.

  Valides-tu ces tests et ces choix (le nom q, la limite de 100 caractères, le 
  texte du message) ? Après ton accord, j'implémente (repository → service →
  controller, puis service, hook et page côté front), je lance npm run check et
  je mets à jour backend/API.md et backend/http/offers.http.

✻ Baked for 1m 36s · done 11:37 AM

❯  Je valide les tests. Pour le délai de frappe : garde 300 ms comme les        
  entreprises et renforce le test « que des espaces » en attendant la fin du    
  délai                                                                         

⏺ Je renforce d'abord le test « que des espaces » : il attendra la fin des 300
  ms avant de vérifier.

⏺ Bash(python3 - <<'EOF'
      p="frontend/tests/OffersPage.test.tsx"…)
  ⎿  (eval):22: no matches found: --include=*.ts
          × transmet le texte saisi à l'API, sans les espaces au début et à
      la fin 6ms
     … +7 lines (ctrl+o to expand)
  ⎿  Updated frontend/tests/OffersPage.test.tsx +6 -5
      1 -import { fireEvent, render, screen, waitFor, within } from "@tes
        -ting-library/react";                                            
      1 +import { act, fireEvent, render, screen, waitFor, within } from 
        +"@testing-library/react";                                       
      2  import { describe, expect, it, vi } from "vitest";
      3  import OffersPage from "../src/pages/OffersPage.tsx";
      4  import { adminUser, contactUser, stubFetch, studentUser } from "
         ./helpers/fetchMock.ts";
     ...
      187      await screen.findByText("Refonte du portail client");
      188 
      189      fireEvent.change(screen.getByLabelText("Rechercher par tit
           re"), { target: { value: "   " } });
      190 +    // On laisse passer le délai de frappe (300 ms) : un appel
          + avec q fautif aurait eu lieu.                                
      191 +    await act(() => new Promise((resolve) => setTimeout(resolv
          +e, 400)));                                                    
      192 
      191 -    await waitFor(() =>                                       
      192 -      expect(fetchMock).toHaveBeenLastCalledWith("/api/offers"
          -, expect.anything()),                                         
      193 -    );                                                        
      194 -    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringCo
          -ntaining("q="), expect.anything());                           
      193 +    const calledUrls = fetchMock.mock.calls.map(([input]) => S
          +tring(input));                                                
      194 +    expect(calledUrls.length).toBeGreaterThan(0);             
      195 +    expect(calledUrls.every((url) => url === "/api/offers")).t
          +oBe(true);                                                    
      196    });
      197 
      198    it("combine la recherche avec la période choisie", async ()
           => {

⏺ Ça échoue toujours pour la bonne raison (pas de champ). J'implémente
  maintenant, en commençant par le backend.

⏺ Bash(grep -rn "getOffers\|useOffers(" frontend/src; python3 - <<'EOF'
      import re…)
  ⎿  frontend/src/pages/OffersPage.tsx:29:  const { offers, isLoading, erro
     r } = useOffers(
     frontend/src/hooks/useOffers.ts:3:import { getOffers } from "../servic
     … +17 lines (ctrl+o to expand)
  ⎿  Updated backend/src/controllers/offers.controller.ts +22 -1
      19    return value;
      20  };
      21 
      22 +const MAX_SEARCH_LENGTH = 100;                                 
      23 +                                                               
      24 +/** Valide le paramètre ?q= : texte facultatif cherché dans le 
         +titre, ignoré s'il est vide. */                                
      25 +const parseSearch = (value: unknown): string | undefined => {  
      26 +  if (value === undefined) return undefined;                   
      27 +  if (typeof value !== "string") {                             
      28 +    throw new HttpError(400, "INVALID_QUERY", "Le paramètre q d
         +oit apparaître une seule fois");                               
      29 +  }                                                            
      30 +  if (value.length > MAX_SEARCH_LENGTH) {                      
      31 +    throw new HttpError(                                       
      32 +      400,                                                     
      33 +      "INVALID_QUERY",                                         
      34 +      `Le paramètre q ne peut pas dépasser ${MAX_SEARCH_LENGTH}
         + caractères`,                                                  
      35 +    );                                                         
      36 +  }                                                            
      37 +                                                               
      38 +  const search = value.trim();                                 
      39 +  return search === "" ? undefined : search;                   
      40 +};                                                             
      41 +                                                               
      42  export const createOffersRouter = (offersService: OffersService
          ) => {
      43    const router = Router();
      44 
      45    router.get("/", authorize(canListOffers), (req, res) => {
      46      const period = parsePeriod(req.query.period);
      27 -    res.json(offersService.listOffers(getCurrentUser(req), peri
         -od).map(toOfferDto));                                          
      47 +    const search = parseSearch(req.query.q);                   
      48 +    res.json(offersService.listOffers(getCurrentUser(req), peri
         +od, search).map(toOfferDto));                                  
      49    });
      50 
      51    return router;
  ⎿  Updated backend/src/repositories/offers.repository.ts +9 -1
       8    depositorContactId?: number;
       9    /** Limite aux offres de cette période (P1, P2 ou OTHER). */
      10    period?: PeriodCode;
      11 +  /** Texte cherché dans le titre, sans tenir compte de la cass
         +e. */                                                          
      12 +  search?: string;                                             
      13  }
      14 
      15  interface FindAllParams {
      16    status: OfferStatus | null;
      17    depositorContactId: number | null;
      18    period: PeriodCode | null;
      19 +  pattern: string | null;                                      
      20  }
      21 
      22 +// Neutralise les jokers de LIKE pour chercher le texte saisi t
         +el quel.                                                       
      23 +const escapeLike = (text: string): string => text.replace(/[\\%
         +_]/g, (char) => `\\${char}`);                                  
      24 +                                                               
      25  export const createOffersRepository = (db: Db) => {
      26    const findAll = db.prepare<FindAllParams, OfferDbo>(`
      27      SELECT o.id, o.title, o.description, o.status,
     ...
      36      WHERE (@status IS NULL OR o.status = @status)
      37        AND (@depositorContactId IS NULL OR o.depositor_contact_i
          d = @depositorContactId)
      38        AND (@period IS NULL OR p.code = @period)
      39 +      AND (@pattern IS NULL OR o.title LIKE @pattern ESCAPE '\\
         +')                                                             
      40      ORDER BY ay.start_date DESC, o.created_at DESC
      41    `);
      42 
      43    return {
      44      /** Offres correspondant au filtre, de la plus récente anné
          e à la plus ancienne. */
      38 -    findAll: ({ status, depositorContactId, period }: OfferFilt
         -er): OfferDbo[] =>                                             
      45 +    findAll: ({ status, depositorContactId, period, search }: O
         +fferFilter): OfferDbo[] =>                                     
      46        findAll.all({
      47          status: status ?? null,
      48          depositorContactId: depositorContactId ?? null,
      49          period: period ?? null,
      50 +        pattern: search === undefined ? null : `%${escapeLike(s
         +earch)}%`,                                                     
      51        }),
      52    };
      53  };
  ⎿  Updated backend/src/services/offers.service.ts +5 -4
      18 
      19  export const createOffersService = (repository: OffersRepositor
          y) => ({
      20    /**
      21 -   * Offres visibles par le profil, éventuellement restreintes 
         -à une période. Le filtre de                                    
      22 -   * période s'ajoute à la visibilité : il ne peut jamais révél
         -er une offre interdite au profil.                              
      21 +   * Offres visibles par le profil, éventuellement restreintes 
         +à une période et à un texte                                    
      22 +   * cherché dans le titre. Ces filtres s'ajoutent à la visibil
         +ité : ils ne peuvent jamais                                    
      23 +   * révéler une offre interdite au profil.                    
      24     */
      24 -  listOffers: (viewer: User, period?: PeriodCode): Offer[] =>  
      25 -    repository.findAll({ ...visibilityFilter(viewer), period })
         -.map(toOffer),                                                 
      25 +  listOffers: (viewer: User, period?: PeriodCode, search?: stri
         +ng): Offer[] =>                                                
      26 +    repository.findAll({ ...visibilityFilter(viewer), period, s
         +earch }).map(toOffer),                                         
      27  });
      28 
      29  export type OffersService = ReturnType<typeof createOffersServi
          ce>;

  Ran 1 shell command (ctrl+o to expand)

⏺ Deux tests échouent à cause de mon test, pas du code : la ligne « papier »
  contient « api », que EF-30 demande d'exclure. Je corrige donc leur attente,
  sans toucher au code. · summary

⏺ Bash(python3 - <<'EOF'
      p="backend/tests/offers.test.ts"…)
  ⎿        Tests  166 passed (166)
  ⎿  Updated backend/tests/offers.test.ts +3 -2
      143    it("ne garde que les offres dont le titre contient le texte,
            sans tenir compte de la casse", async () => {
      144      const response = await listOffersAs("ADMIN", ADMINISTRATOR
           .ANNE_LECLERCQ, "?q=api");
      145 
      146 +    // « API REST de facturation » (casse différente) et « Num
          +érisation d'archives papier ».                                
      147      expect(response.status).toBe(200);
      147 -    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          -]);                                                           
      148 +    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          +, OFFER.ARCHIVE_DIGITIZATION]);                               
      149    });
      150 
      151    it("ignore les espaces au début et à la fin de la recherche"
           , async () => {
      152      const response = await listOffersAs("ADMIN", ADMINISTRATOR
           .ANNE_LECLERCQ, "?q=%20%20api%20");
      153 
      153 -    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          -]);                                                           
      154 +    expect(offerIds(response.body)).toEqual([OFFER.BILLING_API
          +, OFFER.ARCHIVE_DIGITIZATION]);                               
      155    });
      156 
      157    it.each([

⏺ Le backend est vert. Je passe au frontend : service, hook (délai de 300 ms),
  puis page.

⏺ Bash(python3 - <<'EOF'
      def edit(p, pairs):…)
  ⎿        Tests  59 passed (59)
  ⎿  Updated frontend/src/hooks/useOffers.ts +11 -4
       3  import { getOffers } from "../services/offers.service.ts";
       4  import { isUnauthorized } from "../utils/api.ts";
       5 
       6 +// Délai avant d'interroger l'API pendant la frappe d'une reche
         +rche.                                                          
       7 +const SEARCH_DELAY_MS = 300;                                   
       8 +                                                               
       9  /**
      10   * Offres visibles par l'utilisateur, choisies par le backend s
          elon son profil et
       8 - * éventuellement restreintes à une période. Un changement de p
         -ériode relance le chargement.                                  
      11 + * éventuellement restreintes à une période et à un texte cherc
         +hé dans le titre. Un changement                                
      12 + * de période relance le chargement ; une recherche le relance 
         +après le délai de frappe.                                      
      13 + * Les espaces autour de la recherche sont ignorés : une recher
         +che vide ne relance rien.                                      
      14   * onUnauthorized doit être stable (useCallback) pour ne pas re
          lancer inutilement le chargement.
      15   */
      16  export const useOffers = (
      17    token: string,
      18    period: PeriodCode | undefined,
      19 +  search: string,                                              
      20    onUnauthorized: () => void,
      21  ) => {
      22 +  const trimmedSearch = search.trim();                         
      23    const [offers, setOffers] = useState<Offer[]>([]);
      24    const [isLoading, setIsLoading] = useState(true);
      25    const [error, setError] = useState<string | null>(null);
     ...
      30      const load = () => {
      31        setIsLoading(true);
      32        setError(null);
      26 -      getOffers(token, period, controller.signal)              
      33 +      getOffers(token, period, trimmedSearch, controller.signal
         +)                                                              
      34          .then((data) => {
      35            if (!controller.signal.aborted) setOffers(data);
      36          })
     ...
      47          });
      48      };
      49 
      43 -    const timeoutId = window.setTimeout(load, 0);              
      50 +    const timeoutId = window.setTimeout(load, trimmedSearch ===
         + "" ? 0 : SEARCH_DELAY_MS);                                    
      51 
      52      return () => {
      53        window.clearTimeout(timeoutId);
     … +7 lines (ctrl+o to expand)
  ⎿  Updated frontend/src/pages/OffersPage.tsx +11 -1
       4  import LoadingState from "../components/LoadingState.tsx";
       5  import OfferTable from "../components/OfferTable.tsx";
       6  import PeriodFilter, { type PeriodChoice } from "../components/
          PeriodFilter.tsx";
       7 +import SearchField from "../components/SearchField.tsx";       
       8  import { useApplications } from "../hooks/useApplications.ts";
       9  import { useOffers } from "../hooks/useOffers.ts";
      10  import type { Offer } from "../models/offer.ts";
     ...
      27 
      28  const OffersPage = ({ user, token, onUnauthorized }: OffersPage
          Props) => {
      29    const [period, setPeriod] = useState<PeriodChoice>("ALL");
      30 +  const [search, setSearch] = useState("");                    
      31    const { offers, isLoading, error } = useOffers(
      32      token,
      33      period === "ALL" ? undefined : period,
      34 +    search,                                                    
      35      onUnauthorized,
      36    );
      37 
     ...
      113    const renderContent = () => {
      114      if (error) return <ErrorState message={error} />;
      115      if (isLoading) return <LoadingState />;
      113 -    if (offers.length === 0) return <EmptyState message="Aucun
          -e offre à afficher." />;                                      
      116 +    if (offers.length === 0) {                                
      117 +      const emptyMessage =                                    
      118 +        search.trim() === ""                                  
      119 +          ? "Aucune offre à afficher."                        
      120 +          : "Aucune offre ne correspond à la recherche.";     
      121 +      return <EmptyState message={emptyMessage} />;           
      122 +    }                                                         
      123      return (
      124        <>
      125          <p className="result-count">
     ...
      135        <h1>Offres de stage</h1>
      136        <p>{DESCRIPTIONS[user.kind]}</p>
      137        <PeriodFilter label="Filtrer par période" value={period}
            onChange={setPeriod} />
      138 +      <SearchField label="Rechercher par titre" value={search}
          + onChange={setSearch} />                                      
      139        {applyError !== null && <ErrorState message={applyError}
            />}
      140        {renderContent()}
      141      </section>
  ⎿  Updated frontend/src/services/offers.service.ts +5 -1
       4 
       5  export const getOffers = async (
       6    token: string,
       7 -  period?: PeriodCode,                                         
       7 +  period: PeriodCode | undefined,                              
       8 +  search: string,                                              
       9    signal?: AbortSignal,
      10  ): Promise<Offer[]> => {
      11    const params = new URLSearchParams();
      12    if (period !== undefined) {
      13      params.set("period", period);
      14    }
      15 +  if (search.trim() !== "") {                                  
      16 +    params.set("q", search.trim());                            
      17 +  }                                                            
      18    const query = params.size > 0 ? `?${params.toString()}` : "";
      19 
      20    const response = await fetch(`${API_URL}/offers${query}`, {

⏺ Tout est vert. Je vérifie que le test « que des espaces » renforcé détecte
  vraiment l'erreur : je retire le trim côté front temporairement (service et
  hook), puis je restaure.

  Ran 1 shell command (ctrl+o to expand)

⏺ Le test détecte bien l'erreur. Le code est restauré. Je mets maintenant à jour
  la documentation.

  Searched for 1 pattern, read 1 file (ctrl+o to expand)

⏺ Bash(python3 - <<'EOF'
      p="backend/API.md"; s=open(p).read()…)
  ⎿  > oxlint --deny-warnings
     > oxlint --deny-warnings
           Tests  166 passed (166)
     … +3 lines (ctrl+o to expand)
  ⎿  Updated backend/API.md +7 -1
      147  - Header `Authorization` obligatoire
      148  - Paramètre `period` facultatif : `P1`, `P2` ou `OTHER`. Restr
           eint la liste à cette période,
      149    en plus de la visibilité liée au profil (il ne révèle jamais
            une offre interdite au profil).
      150 +- Paramètre `q` facultatif (100 caractères max) : texte cherch
          +é dans le titre, sans tenir                                   
      151 +  compte de la casse. Les espaces au début et à la fin sont ig
          +norés ; une recherche vide                                    
      152 +  renvoie les offres normalement accessibles. Plusieurs mots s
          +ont cherchés comme une                                        
      153 +  expression entière (`q=tableau de bord`) ; `%` et `_` sont p
          +ris tels quels. Les accents                                   
      154 +  ne sont pas normalisés. Combinable avec `period` ; comme lui
          +, il s'ajoute à la visibilité.                                
      155 
      156  ### Réponses
      157 
     ...
      173  `period` vaut `P1`, `P2` ou `OTHER`. `status` vaut `SUBMITTED`
            (soumise), `PENDING`
      174  (en attente), `PUBLISHED` (publiée), `ASSIGNED` (attribuée) ou
            `ARCHIVED` (archivée).
      175 
      171 -- `400` `INVALID_QUERY` : `period` a une valeur autre que `P1`
          -, `P2` ou `OTHER`.                                            
      176 +- `400` `INVALID_QUERY` : `period` a une valeur autre que `P1`
          +, `P2` ou `OTHER`, ou `q`                                     
      177 +  est répété ou dépasse 100 caractères.                       
      178  - `401` `UNAUTHENTICATED` : session absente ou invalide.
      179  - `403` `FORBIDDEN` : contact seulement promoteur ou signatair
           e.
      180 
  ⎿  Updated backend/http/offers.http +20
      38  GET http://localhost:3000/offers?period=P3
      39  Authorization: {{admin.response.body.token}}
      40 
      41 +### Recherche dans le titre, insensible à la casse (administrat
         +eur : 2 offres)                                                
      42 +GET http://localhost:3000/offers?q=api                         
      43 +Authorization: {{admin.response.body.token}}                   
      44 +                                                               
      45 +### Recherche combinée avec la période (administrateur : 3 offr
         +es P2)                                                         
      46 +GET http://localhost:3000/offers?q=de&period=P2                
      47 +Authorization: {{admin.response.body.token}}                   
      48 +                                                               
      49 +### Recherche sans correspondance (liste vide)                 
      50 +GET http://localhost:3000/offers?q=blockchain                  
      51 +Authorization: {{admin.response.body.token}}                   
      52 +                                                               
      53 +### Recherche par l'étudiant : l'offre « portail » non publiée 
         +reste invisible (liste vide)                                   
      54 +GET http://localhost:3000/offers?q=portail                     
      55 +Authorization: {{student.response.body.token}}                 
      56 +                                                               
      57 +### Erreur 400 : paramètre q répété                            
      58 +GET http://localhost:3000/offers?q=api&q=pdf                   
      59 +Authorization: {{admin.response.body.token}}                   
      60 +                                                               
      61  ### Offres vues par l'étudiant
      62  GET http://localhost:3000/offers
      63  Authorization: {{student.response.body.token}}

  Ran 1 shell command (ctrl+o to expand)

⏺ La recherche par mot-clé dans le titre (EF-30) est en place côté API et côté
  page Offres. npm run check passe (code de sortie 0) : 166 tests backend et 59
  tests frontend verts, lint et build sans avertissement. Je n'ai pas fait le
  test manuel au navigateur sur plusieurs profils. Rien n'est commité.

  Ce que j'ai modifié
  - Backend : le controller lit et valide q exactement comme la recherche des
    entreprises (espaces retirés, recherche vide ignorée, 100 caractères au
    maximum, 400 si le paramètre est répété ou trop long). Le service transmet
    la recherche en plus de la visibilité et de la période. Le repository ajoute
    o.title LIKE @pattern ESCAPE '\', en échappant % et _.
  - Frontend : la page Offres a un champ « Rechercher par titre ». Le hook
    attend 300 ms avant d'appeler l'API pendant la frappe, comme pour les
    entreprises. Une recherche faite uniquement d'espaces ne relance aucun
    appel. Si une recherche ne trouve rien, la page affiche « Aucune offre ne
    correspond à la recherche. » ; sans recherche, le message reste « Aucune
    offre à afficher. ».
  - Documentation : backend/API.md et backend/http/offers.http sont à jour.

  Ce qui a changé par rapport aux tests validés
  - Test « que des espaces » : comme demandé, il laisse maintenant passer les
    300 ms (il attend 400 ms), puis vérifie que tous les appels sont
    /api/offers, sans q. Pour vérifier qu'il détecte bien l'erreur, j'ai retiré
    temporairement le trim côté front : il est passé au rouge, puis j'ai
    restauré le code.
  - Deux tests corrigés dans le backend : je m'étais trompé dans l'attente. «
    Numérisation d'archives papier » contient « api ». Comme EF-30 demande un
    texte contenu dans le titre, ?q=api renvoie donc [BILLING_API, 
    ARCHIVE_DIGITIZATION] et non seulement [BILLING_API]. J'ai changé l'attente
    des tests ?q=api et ?q=  api , pas le code.

  Point à trancher : la fonction qui échappe les jokers de LIKE et celle qui
  valide q sont maintenant écrites deux fois, à l'identique, une fois pour les
  entreprises et une fois pour les offres. Je ne les ai pas mises en commun pour
  éviter un refactor que la séance ne demandait pas. Je peux le faire dans un
  commit séparé si tu veux.

✻ Cogitated for 2m 27s · done 11:40 AM```
