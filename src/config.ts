// Configuration unique du démonstrateur : nom du produit, contact, tarifs,
// liens. Tout ce qui est propre à un pays est dans src/countries/.

export const config = {
  productName: 'Chalet Guide',
  /** Courriel de contact affiché par la vitrine (lien mailto:). À déclarer aussi dans tests/pii-allowlist.json. */
  contactEmail: 'johary.lunven@gmail.com',
  /** Régions prioritaires pour la prospection (garder aligné avec scripts/prepare_data.py). */
  priorityRegions: ['Laurentides', 'Lanaudière', "Cantons-de-l'Est", 'Charlevoix'],
  dataset: {
    label: {
      fr: "Source des données d'établissements : Ministère du Tourisme du Québec, Système d'information touristique Québec, via Données Québec (CC-BY 4.0).",
      en: 'Accommodation data source: Ministère du Tourisme du Québec, Système d’information touristique Québec, via Données Québec (CC-BY 4.0).',
    },
    url: 'https://www.donneesquebec.ca/recherche/dataset/chalets-appartements-et-residences-de-tourisme',
  },
  /** Tarifs indicatifs affichés par la vitrine, par devise. */
  pricing: {
    CAD: [
      { id: 'solo', price: 12, period: 'month', units: 1 },
      { id: 'pro', price: 39, period: 'month', units: 5 },
      { id: 'manager', price: null, period: 'month', units: null },
    ],
    EUR: [
      { id: 'solo', price: 9, period: 'month', units: 1 },
      { id: 'pro', price: 29, period: 'month', units: 5 },
      { id: 'manager', price: null, period: 'month', units: null },
    ],
  },
} as const

export type Lang = 'fr' | 'en'
