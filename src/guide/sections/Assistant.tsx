import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Answer, AnswerProvider } from '../../assistant/provider'
import { searchProvider } from '../../assistant/searchProvider'
import { useI18n } from '../../i18n'
import { track } from '../../analytics/track'
import { Icon } from '../../components/Icon'
import { useGuide } from '../context'
import { SectionHeader } from './basic'

// Pour brancher une IA : remplacer ce fournisseur par une implémentation
// d'AnswerProvider qui appelle un backend (aucune clé côté client).
const provider: AnswerProvider = searchProvider

type Msg = { from: 'you'; text: string } | { from: 'bot'; answers: Answer[]; question: string; forwarded?: boolean }

export default function Assistant() {
  const { t, tx, lang } = useI18n()
  const { guide, sectionTitle, link } = useGuide()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [q, setQ] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // scrollIntoView renvoie une promesse dans les navigateurs récents : ne pas la retourner.
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [msgs])
  useEffect(() => {
    setMsgs([])
  }, [lang])

  async function ask(question: string) {
    const text = question.trim()
    if (!text) return
    setQ('')
    const answers = await provider.ask(text, guide, lang)
    track({ type: 'question', guide: guide.slug, question: text.slice(0, 120), answered: answers.length > 0 })
    setMsgs((m) => [...m, { from: 'you', text }, { from: 'bot', answers, question: text }])
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void ask(q)
  }

  function forward(i: number) {
    setMsgs((m) => m.map((msg, j) => (j === i && msg.from === 'bot' ? { ...msg, forwarded: true } : msg)))
  }

  return (
    <article className="section-pad stack assistant">
      <SectionHeader id="assistant" icon="message-circle" lead={t('assistant.intro')} />
      <p className="badge badge-demo">{t('assistant.demoNotice')}</p>

      <div className="chat" role="log" aria-live="polite" aria-label={sectionTitle('assistant')}>
        {msgs.length === 0 && (
          <div className="stack">
            <p className="eyebrow">{t('assistant.suggestions')}</p>
            <div className="chips">
              {guide.faq.map((f, i) => (
                <button key={i} type="button" className="chip" onClick={() => void ask(tx(f.q))}>
                  {tx(f.q)}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.from === 'you' ? (
            <div key={i} className="bubble bubble-you">
              <span className="sr-only">{t('assistant.you')}{t('common.colon')} </span>
              {m.text}
            </div>
          ) : (
            <div key={i} className="bubble bubble-bot">
              <span className="sr-only">{t('assistant.bot')}{t('common.colon')} </span>
              {m.answers.length ? (
                <>
                  <p className="small muted">{t('assistant.found')}</p>
                  {m.answers.map((a, j) => (
                    <div key={j} className="answer">
                      <p className="answer-title">{a.title}</p>
                      <p>{a.text}</p>
                      <a href={link(a.section)} className="small">
                        {t('assistant.seeSection', { section: sectionTitle(a.section) })} →
                      </a>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p>{t('assistant.notFound')}</p>
                  {m.forwarded ? (
                    <p className="small muted">{t('assistant.forwarded')}</p>
                  ) : (
                    <button type="button" className="btn btn-sm btn-forest" onClick={() => forward(i)}>
                      <Icon name="send" size={16} /> {t('assistant.forward')}
                    </button>
                  )}
                </>
              )}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-form" onSubmit={onSubmit}>
        <label htmlFor="chat-q" className="sr-only">
          {t('assistant.placeholder')}
        </label>
        <input id="chat-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('assistant.placeholder')} autoComplete="off" enterKeyHint="send" />
        <button type="submit" className="icon-btn btn-primary-icon" aria-label={t('assistant.send')}>
          <Icon name="send" />
        </button>
      </form>
    </article>
  )
}
