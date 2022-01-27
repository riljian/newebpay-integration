import { FieldConfig } from '../configs'

export const formPost = (endpoint: string, payload: any) => {
  const form = document.createElement('form')
  form.setAttribute('method', 'POST')
  form.setAttribute('action', endpoint)
  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.setAttribute('type', 'hidden')
    input.setAttribute('name', key)
    input.setAttribute('value', value as string)
    form.append(input)
  })
  document.body.appendChild(form)
  form.submit()
}
export const formatValues = <Values, FieldName>(
  values: Values,
  fieldConfigs: Map<FieldName, FieldConfig>
) =>
  Object.entries(values).reduce((acc, [name, value]) => {
    const { mappedKey, formatter } = fieldConfigs.get(name as any as FieldName)!
    const formattedValue = formatter ? formatter(value) : value
    if (!formattedValue && formattedValue !== 0) {
      return acc
    }
    return { ...acc, [mappedKey || name]: formattedValue }
  }, {})
