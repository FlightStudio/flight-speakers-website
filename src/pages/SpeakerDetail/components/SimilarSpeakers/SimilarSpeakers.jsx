import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import SpeakerGrid from "../../../../components/speakers/SpeakerGrid";


function SimilarSpeakers({ speakers }) {
  return (
    <section className="section related-speakers-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            marginBottom: "24px"
          }}
        >
          <h2 className="section-title">Explore<br />Similar Speakers</h2>
          <p style={{
            fontSize: "1.2rem",
            fontWeight: "350"
          }}>Speakers with complementary expertise</p>
        </motion.div>
        <SpeakerGrid speakers={speakers} />
      </div>
    </section>
  );
}

export default SimilarSpeakers;
