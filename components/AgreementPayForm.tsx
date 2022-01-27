import { Box, Button, Grid, Stack } from '@mui/material'
import axios from 'axios'
import { Field, Form, Formik } from 'formik'
import { useMemo, useState } from 'react'
import * as yup from 'yup'
import { formatValues } from '../helpers'
import FormikTextField from './formik/TextField'

type FieldName = 'amount' | 'description' | 'email'
type Values = { [key in FieldName]: any }
interface State {
  request: any
  response: any
}
interface FieldConfig {
  default: any
  mappedKey?: string
  formatter?: (value: any) => any
  schema?: yup.BaseSchema
}

const fieldConfigs = new Map<FieldName, FieldConfig>([
  [
    'amount',
    {
      default: 1234,
      mappedKey: 'Amt',
      schema: yup.number().integer().min(1),
    },
  ],
  [
    'description',
    {
      default: '測試商品資訊欄位',
      mappedKey: 'ProdDesc',
      schema: yup.string().required(),
    },
  ],
  [
    'email',
    {
      default: 'jamie_lin@adata.com',
      mappedKey: 'PayerEmail',
      schema: yup.string().email().required(),
    },
  ],
])
const transformValuesToPayload = (values: Values) =>
  formatValues<Values, FieldName>(values, fieldConfigs)

const AgreementPayForm = () => {
  const [state, setState] = useState<State>(() => ({
    request: null,
    response: null,
  }))
  const { initialValues, validationSchema } = useMemo(
    () => ({
      initialValues: Array.from(fieldConfigs).reduce(
        (acc, [name, config]) => ({
          ...acc,
          [name]: config.default,
        }),
        {}
      ),
      validationSchema: yup.object(
        Array.from(fieldConfigs).reduce(
          (acc, [key, { schema }]) =>
            schema ? { ...acc, [key]: schema } : acc,
          {}
        )
      ),
    }),
    []
  )
  return (
    <Formik
      validationSchema={validationSchema}
      initialValues={initialValues}
      onSubmit={(values) => {
        axios
          .post(
            '/api/v1/orders/creditPay',
            transformValuesToPayload(values as Values)
          )
          .then(({ data }) => {
            setState((s) => ({ ...s, ...data }))
          })
          .catch((error) => {
            const { data } = error.response || {}
            if (data) {
              setState((s) => ({ ...s, response: data }))
            }
            console.error(error.response)
          })
      }}
    >
      <Grid container component={Form} spacing={2}>
        <Grid item xs={6}>
          <Stack spacing={1}>
            <Field
              fullWidth
              name="amount"
              type="number"
              as={FormikTextField}
              label="訂單金額"
            />
            <Field
              fullWidth
              name="description"
              as={FormikTextField}
              helperText="長度限制 50 字元，勿使用特殊符號"
              label="商品資訊"
            />
          </Stack>
        </Grid>
        <Grid item xs={6}>
          <Stack spacing={1}>
            <Field
              fullWidth
              name="email"
              type="email"
              as={FormikTextField}
              label="Email"
              helperText="通知付款人使用"
            />
            <Button type="submit" variant="contained">
              直接付款
            </Button>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Box
            component="pre"
            sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
          >
            {JSON.stringify(state, null, 2)}
          </Box>
        </Grid>
      </Grid>
    </Formik>
  )
}

export default AgreementPayForm
