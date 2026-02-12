import FormField from '../FormField'

function StepBrief({ formData, handleChange, errors }) {
  return (
    <div className="mstep-step__fields">
      <FormField
        label="Tell us about your event and what you're looking for"
        name="brief"
        type="textarea"
        value={formData.brief}
        onChange={handleChange}
        error={errors.brief}
        required
        rows={6}
        placeholder="Describe your event, audience, and the type of speaker or topics you're interested in..."
        autoFocus
      />
    </div>
  )
}

export default StepBrief
