import FormField from '../FormField'

const EVENT_TYPES = [
  'Conference / Summit',
  'Corporate Offsite',
  'Leadership Event',
  'Product Launch',
  'Sales Kickoff',
  'Awards / Gala',
  'Internal Training',
  'Virtual Event',
  'Other',
]

function StepEventOverview({ formData, handleChange, errors }) {
  return (
    <div className="mstep-step__fields">
      <FormField
        label="Event Type"
        name="eventType"
        type="select"
        value={formData.eventType}
        onChange={handleChange}
        options={EVENT_TYPES}
        placeholder="Select event type"
      />
      <FormField
        label="Event Date"
        name="eventDate"
        type="date"
        value={formData.eventDate}
        onChange={handleChange}
      />
      <FormField
        label="Event Location"
        name="eventLocation"
        value={formData.eventLocation}
        onChange={handleChange}
        placeholder="City, Country or Virtual"
      />
    </div>
  )
}

export default StepEventOverview
