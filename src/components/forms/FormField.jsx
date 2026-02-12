import { motion, AnimatePresence } from 'framer-motion'
import WhyWeAsk from './WhyWeAsk'

const EASE = [0.16, 1, 0.3, 1]

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  whyText,
  options,
  rows,
  autoFocus = false,
  children,
}) {
  const inputId = `field-${name}`
  const errorId = `error-${name}`

  const renderInput = () => {
    if (children) return children

    const commonProps = {
      id: inputId,
      name,
      value: value || '',
      onChange,
      className: `form-${type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input'}${error ? ' mstep-field__input--error' : ''}`,
      'aria-required': required || undefined,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
      autoFocus,
    }

    if (type === 'textarea') {
      return <textarea {...commonProps} rows={rows || 5} placeholder={placeholder} />
    }

    if (type === 'select' && options) {
      return (
        <select {...commonProps}>
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    return <input {...commonProps} type={type} placeholder={placeholder} />
  }

  return (
    <div className="mstep-field">
      {label && (
        <label htmlFor={inputId} className="mstep-field__label">
          {label}
          {whyText && <WhyWeAsk text={whyText} />}
        </label>
      )}
      {renderInput()}
      {!label && whyText && <WhyWeAsk text={whyText} />}
      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            className="mstep-field__error"
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FormField
