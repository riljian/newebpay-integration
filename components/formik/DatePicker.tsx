import { MobileDatePicker, MobileDatePickerProps } from '@mui/lab'
import { TextField, TextFieldProps } from '@mui/material'
import { useField } from 'formik'
import { FC } from 'react'

interface Props
  extends Omit<
    MobileDatePickerProps,
    'onChange' | 'value' | 'renderInput' | 'date' | 'openPicker' | 'rawValue'
  > {
  name: string
  helperText?: TextFieldProps['helperText']
}

const FormikDatePickerField: FC<Props> = (props) => {
  const { name, helperText = ' ', ...restProps } = props
  const [{ value, onBlur }, { error, touched }, { setValue }] = useField(name)
  const shouldShowError = touched && !!error
  return (
    <MobileDatePicker
      {...restProps}
      onChange={(changedValue) => setValue(changedValue)}
      value={value}
      renderInput={(textProps) => (
        <TextField
          {...textProps}
          onBlur={onBlur}
          error={shouldShowError}
          helperText={shouldShowError ? error : helperText}
        />
      )}
    />
  )
}

export default FormikDatePickerField
