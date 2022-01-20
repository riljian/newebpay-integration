import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material'
import { useField } from 'formik'
import { forwardRef } from 'react'

interface SelectOption {
  value: any
  label: string
}
interface Props extends SelectProps {
  name: string
  helperText?: string
  options: SelectOption[]
}

const FormikSelectField = forwardRef<HTMLInputElement, Props>(
  function FormikSelectField(props, ref) {
    const {
      name,
      helperText = ' ',
      fullWidth,
      label,
      options,
      labelId,
      ...restProps
    } = props
    const [{ value, onBlur, onChange }, { touched, error }] = useField(name)
    const shouldShowError = touched && !!error
    return (
      <FormControl fullWidth={fullWidth} error={shouldShowError}>
        {label && <InputLabel id={labelId}>{label}</InputLabel>}
        <Select
          {...restProps}
          ref={ref}
          name={name}
          labelId={labelId}
          label={label}
          value={value}
          onBlur={onBlur}
          onChange={onChange}
        >
          {options.map(({ value: optionValue, label: optionLabel }) => (
            <MenuItem key={optionLabel} value={optionValue}>
              {optionLabel}
            </MenuItem>
          ))}
        </Select>
        {(shouldShowError || helperText) && (
          <FormHelperText>
            {shouldShowError ? error : helperText}
          </FormHelperText>
        )}
      </FormControl>
    )
  }
)

export default FormikSelectField
