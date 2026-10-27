// Interface de l'assistant voyageur. La démo utilise une recherche locale
// (searchProvider) ; une IA pourra être branchée plus tard via un backend en
// implémentant la même interface, sans toucher à l'écran de chat.
import type { Lang } from '../config'
import type { Guide, SectionId } from '../content/schema'

export interface Answer {
  /** Extrait du guide qui répond à la question. */
  text: string
  /** Titre de la source (section ou module). */
  title: string
  section: SectionId
  /** Ancre facultative dans la section (ex. id de module). */
  anchor?: string
}

export interface AnswerProvider {
  ask(question: string, guide: Guide, lang: Lang): Promise<Answer[]>
}
