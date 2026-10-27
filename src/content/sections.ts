// Sections du guide. Fichier séparé de schema.ts pour ne pas embarquer Zod
// dans le code livré.
export const SECTIONS = ['arrival', 'wifi', 'house', 'rules', 'departure', 'emergency', 'around', 'options', 'assistant', 'spa'] as const
export type SectionId = (typeof SECTIONS)[number]
