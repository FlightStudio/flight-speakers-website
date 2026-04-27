import express from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import {
  getAllTemplates,
  getTemplateByReasonKey,
  updateTemplate,
} from '../../db/template-queries.js'

const router = express.Router()

router.get('/templates', requireAdmin, async (req, res) => {
  try {
    const templates = await getAllTemplates()
    res.json({ success: true, templates })
  } catch (err) {
    console.error('Templates list error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch templates' })
  }
})

router.get('/templates/:reasonKey', requireAdmin, async (req, res) => {
  try {
    const template = await getTemplateByReasonKey(req.params.reasonKey)
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }
    res.json({ success: true, template })
  } catch (err) {
    console.error('Template lookup error:', err)
    res.status(500).json({ success: false, message: 'Failed to fetch template' })
  }
})

router.put('/templates/:reasonKey', requireAdmin, async (req, res) => {
  try {
    const { label, subject, body } = req.body || {}
    if (label === undefined && subject === undefined && body === undefined) {
      return res.status(400).json({ success: false, message: 'No fields to update' })
    }
    const updated = await updateTemplate(req.params.reasonKey, { label, subject, body })
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Template not found' })
    }
    res.json({ success: true, template: updated })
  } catch (err) {
    console.error('Template update error:', err)
    res.status(500).json({ success: false, message: 'Failed to update template' })
  }
})

export default router
