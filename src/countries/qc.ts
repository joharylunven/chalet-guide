import type { CountryProfile } from '.'

// Sources vérifiées le 26 octobre 2026 :
// - 911 : numéro d'urgence unique au Canada.
// - Info-Santé 811 : https://www.quebec.ca/sante/trouver-une-ressource/info-sante-811
//   (24 h/24, 365 j/an ; option 1 Info-Santé, option 2 Info-Social).
// - Centre antipoison du Québec, 1 800 463-5060, 24 h/24 :
//   https://www.ciusss-capitalenationale.gouv.qc.ca/antipoison/en/a-propos/contact-us
// - Indice SOPFEU : https://www.sopfeu.qc.ca (pas d'API publique, lien seulement).
// - Québec 511 : https://www.quebec511.info
export const qc: CountryProfile = {
  code: 'qc',
  name: { fr: 'Québec', en: 'Québec' },
  locale: { fr: 'fr-CA', en: 'en-CA' },
  currency: 'CAD',
  legalId: {
    label: { fr: 'N° d’enregistrement CITQ', en: 'CITQ registration no.' },
    help: {
      fr: 'Numéro d’enregistrement de l’établissement d’hébergement touristique, obligatoire au Québec.',
      en: 'Tourist accommodation registration number, mandatory in Québec.',
    },
  },
  emergency: [
    {
      id: '911',
      number: '911',
      dial: '911',
      primary: true,
      label: { fr: 'Urgences', en: 'Emergency' },
      description: { fr: 'Police, ambulance, pompiers.', en: 'Police, ambulance, fire.' },
    },
    {
      id: '811',
      number: '811',
      dial: '811',
      label: { fr: 'Info-Santé 811', en: 'Info-Santé 811' },
      description: {
        fr: 'Une infirmière répond 24 h/24 pour un problème de santé non urgent. Option 2 : Info-Social.',
        en: 'A nurse answers 24/7 for non-urgent health concerns. Option 2: Info-Social.',
      },
    },
  ],
  poisonCentre: {
    id: 'poison',
    number: '1 800 463-5060',
    dial: '+18004635060',
    label: { fr: 'Centre antipoison du Québec', en: 'Québec Poison Centre' },
    description: { fr: '24 h/24, en français et en anglais.', en: '24/7, in French and English.' },
  },
  spaNotice: {
    fr: 'Les exigences applicables à un spa dépendent du type d’établissement et de la municipalité. Vérifiez vos obligations auprès des autorités compétentes.',
    en: 'Requirements for a hot tub depend on the type of establishment and the municipality. Check your obligations with the relevant authorities.',
  },
  live: {
    alerts: 'ec',
    roads: 'mtq',
    fire: 'cwfis',
    links: [
      { id: 'sopfeu', label: { fr: 'Indice d’incendie SOPFEU', en: 'SOPFEU fire danger' }, url: 'https://www.sopfeu.qc.ca' },
      { id: '511', label: { fr: 'État des routes — Québec 511', en: 'Road conditions — Québec 511' }, url: 'https://www.quebec511.info' },
      { id: 'ec', label: { fr: 'Alertes météo — Environnement Canada', en: 'Weather alerts — Environment Canada' }, url: 'https://meteo.gc.ca' },
    ],
  },
}
