import { Fragment, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// Keep in sync with the .section .section-title gradient in
// AboutPage.css / HomePage.css
export const SECTION_TITLE_GRADIENT = ['#8F8F8F', '#F5F5F5']

// How much of the scroll range a single letter's fade occupies — the rest is
// spread across the letters as stagger.
const LETTER_FADE_WINDOW = 0.25

function lerpHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const at = (sh) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t)
  return `rgb(${at(16)}, ${at(8)}, ${at(0)})`
}

function ScrubLetter({ progress, range, gradient, style: extraStyle, children }) {
  const opacity = useTransform(progress, range, [0, 1])
  const style = { ...extraStyle, opacity }
  if (gradient) {
    style.backgroundImage = `linear-gradient(to right, ${gradient[0]}, ${gradient[1]})`
    style.WebkitBackgroundClip = 'text'
    style.backgroundClip = 'text'
    style.WebkitTextFillColor = 'transparent'
    // A glyph can overhang its advance width (the tail of "y", italics…) and
    // an inline span's background box would clip it. Padding enlarges the
    // paintable box; negative margins cancel it out of the layout. The clip
    // is still this span's own glyph, so it can't bleed onto neighbours.
    style.padding = '0.15em 0.2em'
    style.margin = '-0.15em -0.2em'
  }
  return <motion.span style={style}>{children}</motion.span>
}

// Scroll-scrubbed letter reveal (à la GSAP SplitText + ScrollTrigger scrub):
// each letter fades 0→1 staggered by its position while the text crosses the
// viewport, and fades back out when scrolling up.
//
// `text` is a string, or an array of { text, style } segments for mixed
// styling within one element. `\n` renders as a line break. `gradient`
// ([from, to] hex pair) reproduces a background-clip:text gradient like
// .section-title's: opacity on child spans can't fade a gradient painted by
// the parent, so each letter paints its own slice of the ramp (interpolated
// by position in its line — each line runs the full ramp) and the parent's
// background is disabled.
function ScrollLetterReveal({ text, className, as: Tag = 'p', gradient, style }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'end 0.6'],
  })

  const segments = Array.isArray(text) ? text : [{ text }]
  const plainText = segments.map(s => s.text).join('')
  const totalChars = Math.max(plainText.replace(/[ \n]/g, '').length, 1)

  // Flatten segments into a char stream, then group into lines and words so
  // words can be kept unbreakable while chars keep their segment's style.
  const lines = [[]]
  let word = []
  const pushWord = () => { lines[lines.length - 1].push(word); word = [] }
  for (const seg of segments) {
    for (const char of seg.text) {
      if (char === '\n') { pushWord(); lines.push([]) }
      else if (char === ' ') pushWord()
      else word.push({ char, style: seg.style })
    }
  }
  pushWord()

  let charIndex = 0

  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={plainText}
      style={gradient || style ? { ...(gradient && { background: 'none' }), ...style } : undefined}
    >
      {lines.map((words, li) => {
        const lineLen = Math.max(words.reduce((n, w) => n + w.length + 1, 0) - 1, 1)
        let lineOffset = 0
        return (
          <Fragment key={li}>
            {li > 0 && <br />}
            {words.map((wordChars, wi) => {
              const wordStart = lineOffset
              lineOffset += wordChars.length + 1
              return (
                <Fragment key={wi}>
                  {/* inline-block keeps words from breaking mid-word across lines */}
                  <span aria-hidden="true" style={{ display: 'inline-block' }}>
                    {wordChars.map(({ char, style: charStyle }, ci) => {
                      const start = (charIndex++ / totalChars) * (1 - LETTER_FADE_WINDOW)
                      const letterGradient = gradient && [
                        lerpHex(gradient[0], gradient[1], (wordStart + ci) / lineLen),
                        lerpHex(gradient[0], gradient[1], (wordStart + ci + 1) / lineLen),
                      ]
                      return (
                        <ScrubLetter
                          key={ci}
                          progress={scrollYProgress}
                          range={[start, start + LETTER_FADE_WINDOW]}
                          gradient={letterGradient}
                          style={charStyle}
                        >
                          {char}
                        </ScrubLetter>
                      )
                    })}
                  </span>
                  {wi < words.length - 1 && ' '}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </Tag>
  )
}

export default ScrollLetterReveal
