import { Checkbox, CheckboxProps, FormControlLabel } from '@mui/material'
import { useField } from 'formik'
import { forwardRef } from 'react'

interface Props extends CheckboxProps {
  name: string
  label: string
}

const FormikCheckboxField = forwardRef<HTMLButtonElement, Props>(
  function FormikCheckboxField(props, ref) {
    const { label, disabled, name, ...restProps } = props
    const [{ value, onChange }] = useField(name)
    return (
      <FormControlLabel
        disabled={disabled}
        control={
          <Checkbox
            {...restProps}
            name={name}
            ref={ref}
            checked={value}
            onChange={onChange}
          />
        }
        label={label}
      />
    )
  }
)

export default FormikCheckboxField
