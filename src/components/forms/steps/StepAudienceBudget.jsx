import FormField from '../FormField'

const BUDGET_RANGES = [
  'Under $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000 - $100,000',
  'Over $100,000',
  'Flexible / To be discussed',
]

function StepAudienceBudget({ formData, handleChange, errors }) {
  return (
    <div className="mstep-step__fields">
      <FormField
        label="Audience Size"
        name="audienceSize"
        value={formData.audienceSize}
        onChange={handleChange}
        placeholder="e.g., 200 attendees"
      />
      <FormField
        label="Budget Range"
        name="budgetRange"
        type="select"
        value={formData.budgetRange}
        onChange={handleChange}
        options={BUDGET_RANGES}
        placeholder="Select budget range"
      />
    </div>
  )
}

export default StepAudienceBudget
