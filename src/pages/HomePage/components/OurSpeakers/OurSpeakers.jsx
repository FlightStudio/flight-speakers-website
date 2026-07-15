import "./OurSpeakers.css";

import {
  useState,
  useMemo
} from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'

import SpeakerCard from '../../../../components/speakers/SpeakerCard'
import ScrollLetterReveal, { SECTION_TITLE_GRADIENT } from '../../../../components/ScrollLetterReveal/ScrollLetterReveal'

function OurSpeakers({ speakers }) {
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all')
  
  const filteredSpeakers = useMemo(() => {
    if (activeFilter === 'all') {
      return speakers;
    }
    return speakers.filter(s =>
      s.topics?.some(t => t.toLowerCase().includes(activeFilter.toLowerCase()))
    )
  }, [speakers, activeFilter])

  return (
    <section className="section speakers-section">
      <div className="section-left">
        <motion.span
          className="section-label"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >Our Speakers</motion.span>
      </div>
      <div className="container" style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <div>
          <ScrollLetterReveal
            as="h2"
            className="section-title"
            gradient={SECTION_TITLE_GRADIENT}
            text={"Exceptional talent,\nvetted for excellence"}
          />
          <ScrollLetterReveal
            className="section-subtitle"
            style={{ marginBottom: "28px" }}
            text="Each speaker is personally selected for their ability to captivate and inspire."
          />
        </div>

        {/* Speaker Carousel */}
        <div className="speakers-carousel">
          <div className="speakers-carousel__track">
            {filteredSpeakers.map((speaker, i) => (
              <motion.div
                key={speaker.id}
                className="speakers-carousel__item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <SpeakerCard speaker={speaker} index={i} />
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button
          className="hero-search__button book-a-speaker__btn our-speakers__button"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            navigate('/speakers');
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20.022 20.022" fill="none" aria-hidden="true">
            <path d="M 9.451 1.29 C 9.664 0.8 10.358 0.8 10.571 1.29 L 12.945 6.76 C 13.006 6.902 13.119 7.015 13.261 7.077 L 18.732 9.451 C 19.221 9.664 19.221 10.358 18.732 10.571 L 13.261 12.945 C 13.119 13.006 13.006 13.119 12.945 13.261 L 10.571 18.732 C 10.358 19.221 9.664 19.221 9.451 18.732 L 7.077 13.261 C 7.015 13.119 6.902 13.006 6.76 12.945 L 1.29 10.571 C 0.8 10.358 0.8 9.664 1.29 9.451 L 6.76 7.077 C 6.902 7.015 7.015 6.902 7.077 6.76 L 9.451 1.29 Z" fill="currentColor" />
          </svg>

          Explore All Speakers
        </motion.button>
      </div>
    </section>
  );
}

export default OurSpeakers;