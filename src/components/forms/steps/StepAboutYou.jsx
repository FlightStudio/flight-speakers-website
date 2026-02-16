import FormField from '../FormField'

function StepAboutYou({ formData, handleChange, errors }) {
  return (
    <div className="mstep-step__fields">
      <FormField
        label="Full Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
        placeholder="Your full name"
        autoFocus
      />
      <FormField
        label="Organization"
        name="organization"
        value={formData.organization}
        onChange={handleChange}
        error={errors.organization}
        required
        placeholder="Company or organization name"
      />
    </div>
  )
}

export default StepAboutYou
