import { motion } from 'framer-motion'
import { EASE } from '../../constants/animation'
import EnquiryList from '../components/EnquiryList'

export default function AdminEnquiriesPage() {
  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="admin-page__header">
        <h1 className="admin-page__title">Enquiries</h1>
        <p className="admin-page__subtitle">Manage speaker enquiries and requests</p>
      </div>

      <EnquiryList />
    </motion.div>
  )
}
