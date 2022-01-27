import * as yup from 'yup'

export interface FieldConfig {
  default: any
  mappedKey?: string
  formatter?: (value: any) => any
  schema?: yup.BaseSchema
}
