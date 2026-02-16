import FormField from '../FormField'

function StepContactDetails({ formData, handleChange, errors }) {
  return (
    <div className="mstep-step__fields">
      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        placeholder="you@company.com"
        autoFocus
      />
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="+44 7700 900000"
      />
    </div>
  )
}

export default StepContactDetails
