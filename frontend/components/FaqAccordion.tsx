"use client"

import { useState } from 'react'

const faqData = [
  { question: 'Что за клуб?', answer: 'СИНКЭЛЭЙ — это закрытое сообщество для развития soft skills, финансовой грамотности и психологии. Мы объединяем практиков и экспертов, чтобы знания становились навыками.' }, 
  { question: 'Что входит в подписку?', answer: 'Полный доступ ко всем 4 курсам, 20+ дополнительным материалам, вебинарам, подкастам, дз и сертификатам. Новые форматы добавляются каждый месяц.' },
  { question: 'Что за название?', answer: '«Синкэлэй» (Thinkelay) — от английских слов Think (мыслить) и Relay (передавать, соединять). Символизирует передачу осмысленных знаний и связь поколений.' },
  { question: 'Кто ведущие?', answer: 'В клубе выступают приглашённые эксперты — бизнес-тренеры, психологи, коучи и яркие практики, среди которых Иван Бобров, Дмитрий Денисенко и другие.' },
  { question: 'Будет ли дальше развиваться?', answer: 'Конечно! Планируются новые курсы по креативности, публичным выступлениям, а также воркшопы с международными спикерами. Развитие идёт постоянно.' },
]

export function FaqAccordion({ styles }: { styles: Record<string, string> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={styles.faqList}>
      {faqData.map((item, index) => (
        <div key={index} className={styles.faqItem}>
          <button
            className={`${styles.faqQuestion} ${openIndex === index ? styles.faqQuestionOpen : ''}`}
            onClick={() => toggle(index)}
          >
            <span>{item.question}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
          <div className={`${styles.faqAnswer} ${openIndex === index ? styles.faqAnswerOpen : ''}`}>
            {item.answer}
          </div>
        </div>
      ))}
    </div>
  )
}