import type { CountryProfile } from '.'

// Sources vérifiées le 26 octobre 2026 :
// - 112, 15, 17, 18, 114 : https://www.entreprises.gouv.fr/secteurs-dactivite/numerique/communications-durgence
//   (le 114 fonctionne par SMS, fax ou application, pas par appel vocal).
// - Centres antipoison : https://www.centres-antipoison.net (liste officielle des 8 centres).
//   Le centre dépend de la région : il est déclaré dans chaque guide (emergency.poisonCentre),
//   sinon le guide renvoie vers la liste officielle.
// - Vigilance météo : https://vigilance.meteofrance.fr (flux de données non intégré :
//   licence et CORS à vérifier, voir CLAUDE.md).
export const fr: CountryProfile = {
  code: 'fr',
  name: { fr: 'France', en: 'France' },
  locale: { fr: 'fr-FR', en: 'en-GB' },
  currency: 'EUR',
  legalId: {
    label: { fr: 'N° d’enregistrement du meublé', en: 'Holiday rental registration no.' },
    help: {
      fr: 'Numéro d’enregistrement du meublé de tourisme, lorsque la commune l’exige.',
      en: 'Holiday rental registration number, where the municipality requires one.',
    },
  },
  emergency: [
    {
      id: '112',
      number: '112',
      dial: '112',
      primary: true,
      label: { fr: 'Urgence européenne', en: 'European emergency' },
      description: { fr: 'Depuis n’importe quel téléphone, partout dans l’UE.', en: 'From any phone, anywhere in the EU.' },
    },
    {
      id: '15',
      number: '15',
      dial: '15',
      label: { fr: 'SAMU', en: 'Medical emergency (SAMU)' },
      description: { fr: 'Urgence médicale.', en: 'Medical emergency.' },
    },
    {
      id: '18',
      number: '18',
      dial: '18',
      label: { fr: 'Pompiers', en: 'Fire brigade' },
      description: { fr: 'Incendie, accident, secours.', en: 'Fire, accident, rescue.' },
    },
    {
      id: '17',
      number: '17',
      dial: '17',
      label: { fr: 'Police secours', en: 'Police' },
      description: { fr: 'Agression, vol, danger immédiat.', en: 'Assault, theft, immediate danger.' },
    },
    {
      id: '114',
      number: '114',
      dial: 'sms:114',
      label: { fr: '114 (SMS)', en: '114 (text)' },
      description: {
        fr: 'Pour les personnes sourdes, malentendantes ou qui ne peuvent pas parler. Par SMS.',
        en: 'For deaf, hard-of-hearing or speech-impaired people. By text message.',
      },
    },
  ],
  poisonCentre: null,
  poisonCentres: {
    marseille: {
      id: 'poison',
      number: '04 91 75 25 25',
      dial: '+33491752525',
      label: { fr: 'Centre antipoison de Marseille', en: 'Marseille Poison Centre' },
      description: { fr: '24 h/24, 7 j/7. Couvre la région Provence-Alpes-Côte d’Azur.', en: '24/7. Covers the Provence-Alpes-Côte d’Azur region.' },
    },
  },
  poisonDirectory: {
    label: { fr: 'Liste officielle des centres antipoison', en: 'Official list of poison centres' },
    url: 'https://www.centres-antipoison.net',
  },
  // Mention imposée par CLAUDE.md : ne jamais affirmer qu'un gîte ou une chambre
  // d'hôtes est soumis ou non à l'obligation.
  spaNotice: {
    fr: 'Le cadre réglementaire (Code de la santé publique, art. D.1332-1 et suivants, textes 2025-2026) dépend du type d’établissement. Vérifiez vos obligations auprès de votre ARS.',
    en: 'The regulatory framework (French Public Health Code, art. D.1332-1 et seq., 2025-2026 texts) depends on the type of establishment. Check your obligations with your regional health agency (ARS).',
  },
  live: {
    alerts: null,
    roads: null,
    fire: null,
    links: [
      { id: 'vigilance', label: { fr: 'Vigilance Météo-France', en: 'Météo-France weather warnings' }, url: 'https://vigilance.meteofrance.fr' },
    ],
  },
}
