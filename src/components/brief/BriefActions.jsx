import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { pdf } from '@react-pdf/renderer'
import SpeakerBrief from './SpeakerBrief'
import { EASE } from '../../constants/animation'

function esc(str) {
  if (!str) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function buildSpeakerCard(s) {
  const bioPreview = s.bio ? s.bio.split('\n\n').slice(0, 2).map(p => esc(p)).join('<br><br>') : ''
  const topics = (s.topics || []).slice(0, 5).map(t => `<span style="display:inline-block;padding:2px 10px;background:#f5f5f3;border-radius:4px;font-size:12px;color:#404040;margin:2px 4px 2px 0">${esc(t)}</span>`).join('')
  return `
    <div style="padding:16px 0;border-bottom:1px solid #f0f0ee">
      <div style="display:flex;gap:16px;margin-bottom:10px">
        ${s.photo ? `<img src="${esc(s.photo)}" style="width:80px;height:80px;border-radius:12px;object-fit:cover" />` : ''}
        <div style="flex:1">
          <div style="font-weight:700;font-size:18px;margin-bottom:4px">${esc(s.name)}</div>
          <div style="font-size:13px;color:#737373;margin-bottom:6px">${esc(s.headline)}</div>
          ${topics ? `<div>${topics}</div>` : ''}
        </div>
      </div>
      ${bioPreview ? `<div style="font-size:14px;color:#404040;line-height:1.7;margin-bottom:12px">${bioPreview}</div>` : ''}
      ${s.videoUrl ? `
      <div style="display:flex;align-items:center;gap:12px;background:#fafaf8;border:1px solid #e8e8e6;border-radius:8px;padding:12px;margin-bottom:12px">
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:2px">Sizzle Reel</div>
          <a href="${esc(s.videoUrl)}" target="_blank" style="font-size:12px;color:#3b82f6;text-decoration:none">Watch ${esc(s.name.split(' ')[0])}'s speaker reel &rarr;</a>
        </div>
      </div>` : ''}
      ${s.reasoning || s.matchScore != null ? `
      <div style="background:#fafaf8;border:1px solid #e8e8e6;border-radius:8px;padding:12px">
        ${s.reasoning ? `<div style="font-size:13px;color:#404040;line-height:1.5;font-style:italic">${esc(s.reasoning)}</div>` : ''}
        ${s.matchScore != null ? `<div style="font-size:13px;font-weight:700;color:#16a34a;margin-top:4px">${s.matchScore}% match</div>` : ''}
      </div>` : ''}
    </div>
  `
}

function buildHtmlBrief({ speaker, reasoning, matchScore, selectedSpeakers, aiRecommendations, query, hasAiMatch }) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const bioPreview = speaker.bio ? speaker.bio.split('\n\n').slice(0, 2).map(p => esc(p)).join('<br><br>') : ''
  const topics = (speaker.topics || []).map(t => `<span style="display:inline-block;padding:2px 10px;background:#f5f5f3;border-radius:4px;font-size:12px;color:#404040;margin:2px 4px 2px 0">${esc(t)}</span>`).join('')

  const selectedCards = (selectedSpeakers || []).slice(0, 6).map(buildSpeakerCard).join('')
  const aiCards = (aiRecommendations || []).slice(0, 4).map(buildSpeakerCard).join('')

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Speaker Brief: ${esc(speaker.name)} | Flight Speakers</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#1a1a1a; background:#fafaf8; }
  .page { max-width:680px; margin:40px auto; background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:48px; }
  .section-title { font-size:15px; font-weight:700; margin-top:24px; margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #f0f0ee; }
  @media print { body{background:#fff} .page{box-shadow:none;margin:0;max-width:100%;border-radius:0} .no-print{display:none!important} }
  @media (max-width:720px) { .page{margin:0;border-radius:0;padding:24px} }
</style>
</head><body>
<div class="page">
  <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e8e8e6">
    <div style="font-size:24px;font-weight:700;letter-spacing:-0.5px;margin-bottom:4px">Your Brief</div>
    <div style="display:flex;justify-content:space-between;font-size:13px;color:#94a3b8">
      <span>Prepared by Flight Speakers</span>
      <span>${esc(today)}</span>
    </div>
  </div>

  ${query ? `
  <div style="background:#fafaf8;border:1px solid #e8e8e6;border-radius:8px;padding:16px;margin-bottom:24px">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Your Event Brief</div>
    <div style="font-size:14px;color:#404040;line-height:1.6;font-style:italic">${esc(query)}</div>
  </div>` : ''}

  <div style="font-size:11px;font-weight:700;color:#E85D4C;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px">${hasAiMatch ? 'AI Recommended Speaker' : 'Recommended Speaker'}</div>
  <div style="display:flex;gap:20px;margin-bottom:16px">
    ${speaker.photo ? `<img src="${esc(speaker.photo)}" style="width:90px;height:90px;border-radius:12px;object-fit:cover" />` : ''}
    <div style="flex:1">
      <div style="font-size:20px;font-weight:700;margin-bottom:4px">${esc(speaker.name)}</div>
      <div style="font-size:14px;color:#737373;margin-bottom:8px">${esc(speaker.headline)}</div>
      <div>${topics}</div>
    </div>
  </div>
  ${bioPreview ? `<div style="font-size:14px;color:#404040;line-height:1.7;margin-bottom:20px">${bioPreview}</div>` : ''}

  ${reasoning ? `
  <div style="background:#fafaf8;border:1px solid #e8e8e6;border-radius:8px;padding:16px;margin-bottom:20px">
    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Why this speaker matches your brief</div>
    <div style="font-size:14px;color:#404040;line-height:1.6;font-style:italic">${esc(reasoning)}</div>
    ${matchScore != null ? `<div style="font-size:13px;font-weight:700;color:#16a34a;margin-top:6px">${matchScore}% match</div>` : ''}
  </div>` : ''}

  ${speaker.videoUrl ? `
  <div style="display:flex;align-items:center;gap:16px;background:#fafaf8;border:1px solid #e8e8e6;border-radius:8px;padding:16px;margin-bottom:20px">
    ${speaker.photo ? `<img src="${esc(speaker.photo)}" style="width:80px;height:52px;border-radius:6px;object-fit:cover" />` : ''}
    <div>
      <div style="font-size:13px;font-weight:600;margin-bottom:2px">Sizzle Reel</div>
      <a href="${esc(speaker.videoUrl)}" target="_blank" style="font-size:12px;color:#3b82f6;text-decoration:none">Watch ${esc(speaker.name.split(' ')[0])}'s speaker reel &rarr;</a>
    </div>
  </div>` : ''}

  ${selectedCards ? `
  <div class="section-title">Your Selected Speakers</div>
  <div>${selectedCards}</div>` : ''}

  ${aiCards ? `
  <div class="section-title">${hasAiMatch ? 'Other AI Recommendations' : 'Other Recommendations'}</div>
  <div>${aiCards}</div>` : ''}

  <div style="margin-top:32px;padding-top:12px;border-top:1px solid #e8e8e6;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8">
    <span style="font-weight:600">Flight Speakers</span>
    <span>hello@flightspeakers.com</span>
  </div>
</div>
<div class="no-print" style="text-align:center;padding:20px;font-size:13px;color:#94a3b8">
  Press <kbd style="padding:2px 6px;background:#f0f0ee;border-radius:4px;font-size:12px">Ctrl+P</kbd> / <kbd style="padding:2px 6px;background:#f0f0ee;border-radius:4px;font-size:12px">&#8984;P</kbd> to save as PDF
</div>
</body></html>`
}

export default function BriefActions({ speaker, reasoning, matchScore, otherSpeakers, selectedSpeakers, aiRecommendations, query, variant = 'default', showSubmitBrief = false, selectedSpeakersForSubmit = [] }) {
  const [generating, setGenerating] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  // Backward compat: if caller passes otherSpeakers but not the new split props,
  // treat them all as AI recommendations
  const resolvedSelected = selectedSpeakers || []
  const resolvedAiRecs = aiRecommendations || otherSpeakers || []

  const generatePdf = useCallback(async () => {
    const doc = (
      <SpeakerBrief
        speaker={speaker}
        reasoning={reasoning}
        matchScore={matchScore}
        selectedSpeakers={resolvedSelected}
        aiRecommendations={resolvedAiRecs}
        query={query}
      />
    )
    return pdf(doc).toBlob()
  }, [speaker, reasoning, matchScore, resolvedSelected, resolvedAiRecs, query])

  const handleDownload = useCallback(async () => {
    setGenerating(true)
    try {
      const blob = await generatePdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${speaker.name.replace(/\s+/g, '-')}-Speaker-Brief.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
      setShowMenu(false)
    }
  }, [speaker, generatePdf])

  const handleSubmitBrief = useCallback(() => {
    setShowMenu(false)
    navigate(`/enquiry?brief=${encodeURIComponent(query)}`, {
      state: { selectedSpeakers: selectedSpeakersForSubmit },
    })
  }, [navigate, query, selectedSpeakersForSubmit])

  const handleShareEmail = useCallback(() => {
    // Open the HTML brief in a new tab
    const hasAiMatch = !!(reasoning || matchScore)
    const html = buildHtmlBrief({ speaker, reasoning, matchScore, selectedSpeakers: resolvedSelected, aiRecommendations: resolvedAiRecs, query, hasAiMatch })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60000)

    // Open mailto with text summary
    const subject = encodeURIComponent(`Speaker Recommendation: ${speaker.name} | Flight Speakers`)
    const topicsList = (speaker.topics || []).slice(0, 4).join(', ')
    const body = encodeURIComponent(
      `Hi,\n\n` +
      `I'd like to share a speaker recommendation with you.\n\n` +
      `${speaker.name} / ${speaker.headline}\n` +
      (topicsList ? `Topics: ${topicsList}\n` : '') +
      (reasoning ? `\nWhy they're a great fit:\n${reasoning}\n` : '') +
      (matchScore != null ? `Match: ${matchScore}%\n` : '') +
      `\nI've opened the full brief in a new tab. Paste the link here or forward the page directly.\n\n` +
      `Best regards`
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }, [speaker, reasoning, matchScore, resolvedSelected, resolvedAiRecs, query])

  // Sticky variant — floating button with expandable menu
  if (variant === 'sticky') {
    return (
      <div className="brief-sticky">
        <motion.button
          className="brief-sticky__trigger brief-sticky__trigger--icon"
          onClick={() => setShowMenu(!showMenu)}
          whileTap={{ scale: 0.95 }}
          disabled={generating}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="brief-sticky__label">{generating ? 'Generating...' : 'Share'}</span>
        </motion.button>
        <AnimatePresence>
          {showMenu && (
            <motion.div
              className="brief-sticky__menu"
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <button className="brief-sticky__option" onClick={handleDownload} disabled={generating}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download PDF
              </button>
              {/* <button className="brief-sticky__option" onClick={handleShareEmail} disabled={generating}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Share via Email
              </button> */}
              {showSubmitBrief && (
                <button className="brief-sticky__option brief-sticky__option--primary" onClick={handleSubmitBrief}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7H11.5M11.5 7L7 2.5M11.5 7L7 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Submit Brief
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Inline buttons (default / small)
  const btnClass = variant === 'small'
    ? 'brief-btn brief-btn--small'
    : 'brief-btn'

  return (
    <div className="brief-actions">
      <button
        className={btnClass}
        onClick={handleDownload}
        disabled={generating}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {generating ? 'Generating...' : 'Download Brief'}
      </button>
      {/* <button className={`${btnClass} brief-btn--secondary`} onClick={handleShareEmail} disabled={generating}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Share via Email
      </button> */}
    </div>
  )
}
