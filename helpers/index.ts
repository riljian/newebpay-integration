export const formPost = (endpoint: string, payload: any) => {
  const form = document.createElement('form')
  form.setAttribute('method', 'POST')
  form.setAttribute('action', endpoint)
  form.setAttribute('target', '_blank')
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
