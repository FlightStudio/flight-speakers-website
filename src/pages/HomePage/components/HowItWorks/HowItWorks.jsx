import "./HowItWorks.css";

import { useState } from 'react'
import {
  motion,
  AnimatePresence
} from 'framer-motion'

import { EASE } from '../../../../constants/animation'

import EnhancedAIDemo from './components/EnhancedAIDemo/EnhancedAIDemo'
import { steps } from "./config";

function HowItWorks({ speakers }) {
  return (
    <section className="section ai-demo-section" style={{
      paddingTop: "0 !important"
    }}>
      <div className="section-left">
        <motion.span
          className="section-label"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >How It Works</motion.span>
      </div>
      <div className="container">
        <div className="ai-demo-layout">
          <motion.div
            className="ai-demo-layout__text"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="section-title">AI-powered<br/>speaker matching</h2>
            <p className="section-subtitle">
              Describe your event in plain language. Our AI extracts what matters, <span style={{ color: "#676767"}}>scans our curated roster, and surfaces the speakers who'll make the biggest impact.</span>
            </p>

            <div className="ai-demo-layout__steps">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  className="ai-demo-layout__step"
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 1.6, ease: EASE }}
                  layout
                >
                  <span className="ai-demo-layout__step-num">{s.num}</span>
                  <div>
                    <span className="ai-demo-layout__step-title">{s.title}</span>
                    <div className="ai-demo-layout__step-desc">
                      <p>{s.desc} {s.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="ai-demo-layout__window"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            {/* Window chrome */}
            <div className="ai-window__bar">
              <div className="ai-window__dots">
                <span /><span /><span />
              </div>
              <span className="ai-window__title">flight-speakers / AI matching</span>
            </div>
            <div className="ai-window__body">
              <EnhancedAIDemo speakers={speakers} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks;