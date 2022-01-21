import { LocalizationProvider } from '@mui/lab'
import DateAdapter from '@mui/lab/AdapterDateFns'
import { Box, Button, Container, Grid, Stack } from '@mui/material'
import axios from 'axios'
import { addDays, format } from 'date-fns'
import { Field, Form, Formik } from 'formik'
import { GetServerSideProps, NextPage } from 'next'
import { useMemo, useState } from 'react'
import * as yup from 'yup'
import FormikCheckboxField from '../../components/formik/Checkbox'
import FormikDatePickerField from '../../components/formik/DatePicker'
import FormikSelectField from '../../components/formik/Select'
import FormikTextField from '../../components/formik/TextField'
import { SupportedLanguage } from '../../configs/newebpay'
import { ORDERS_RESULT_PATH, ORDERS_TICKET_PATH } from '../../configs/path'
import { formPost } from '../../helpers'

type FieldName =
  | 'language'
  | 'description'
  | 'amount'
  | 'tradeLimit'
  | 'expireDate'
  | 'returnNewebpayAfterPaid'
  | 'returnNewebpayAfterTicketGot'
  | 'showReturnButton'
  | 'email'
  | 'modifyEmail'
  | 'orderComment'
  | 'enableCredit'
  | 'enableWebATM'
  | 'enableVacc'
type Values = { [key in FieldName]: any }
interface FieldConfig {
  default: any
  mappedKey?: string
  formatter?: (value: any) => any
  schema?: yup.BaseSchema
}
interface State {
  newebpayForm: any
}

const languageOptions = [
  {
    label: '繁體中文',
    value: SupportedLanguage.TRADITIONAL_CHINESE,
  },
  {
    label: '英文',
    value: SupportedLanguage.ENGLISH,
  },
  {
    label: '日文',
    value: SupportedLanguage.JAPANESE,
  },
]
const fieldConfigs = new Map<FieldName, FieldConfig>([
  [
    'language',
    {
      default: SupportedLanguage.TRADITIONAL_CHINESE,
      mappedKey: 'LangType',
    },
  ],
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
      mappedKey: 'ItemDesc',
      schema: yup.string().required(),
    },
  ],
  [
    'tradeLimit',
    {
      default: 0,
      mappedKey: 'TradeLimit',
      schema: yup.number().integer().max(900),
    },
  ],
  [
    'expireDate',
    {
      default: addDays(new Date(), 6),
      mappedKey: 'ExpireDate',
      formatter: (value: Date) => format(value, 'YMMdd'),
    },
  ],
  [
    'returnNewebpayAfterPaid',
    {
      default: false,
      mappedKey: 'ReturnURL',
      formatter: (value: boolean) =>
        typeof window !== 'undefined' && value
          ? `${window.origin}${ORDERS_RESULT_PATH}`
          : '',
    },
  ],
  [
    'returnNewebpayAfterTicketGot',
    {
      default: false,
      mappedKey: 'CustomerURL',
      formatter: (value: boolean) =>
        typeof window !== 'undefined' && value
          ? `${window.origin}${ORDERS_TICKET_PATH}`
          : '',
    },
  ],
  [
    'showReturnButton',
    {
      default: false,
      mappedKey: 'ClientBackURL',
      formatter: (value: boolean) =>
        typeof window !== 'undefined' && value ? window.origin : '',
    },
  ],
  [
    'email',
    {
      default: 'jamie_lin@adata.com',
      mappedKey: 'Email',
      schema: yup.string().email().required(),
    },
  ],
  [
    'modifyEmail',
    {
      default: true,
      mappedKey: 'EmailModify',
      formatter: (value: boolean) => (value ? 1 : 0),
    },
  ],
  [
    'orderComment',
    {
      default: '',
      mappedKey: 'OrderComment',
    },
  ],
  [
    'enableCredit',
    {
      default: true,
      mappedKey: 'CREDIT',
      formatter: (value: boolean) => (value ? 1 : 0),
    },
  ],
  [
    'enableWebATM',
    {
      default: true,
      mappedKey: 'WEBATM',
      formatter: (value: boolean) => (value ? 1 : 0),
    },
  ],
  [
    'enableVacc',
    {
      default: true,
      mappedKey: 'VACC',
      formatter: (value: boolean) => (value ? 1 : 0),
    },
  ],
])
const transformValuesToPayload = (values: Values) =>
  Object.entries(values).reduce((acc, [name, value]) => {
    const { mappedKey, formatter } = fieldConfigs.get(name as FieldName)!
    const formattedValue = formatter ? formatter(value) : value
    if (!formattedValue) {
      return acc
    }
    return { ...acc, [mappedKey || name]: formattedValue }
  }, {})

const CreateOrder: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  const [{ newebpayForm }, setState] = useState<State>(() => ({
    newebpayForm: null,
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
    <Container sx={{ py: 2 }}>
      <LocalizationProvider dateAdapter={DateAdapter}>
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={(values) => {
            axios
              .post(
                '/api/v1/orders',
                transformValuesToPayload(values as Values)
              )
              .then(({ data }) => {
                setState((s) => ({ ...s, newebpayForm: data }))
              })
              .catch((error) => {
                console.error(error)
              })
          }}
        >
          {({ values }) => (
            <Grid container component={Form} spacing={2}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <FormikSelectField
                    fullWidth
                    name="language"
                    options={languageOptions}
                    label="語系"
                    labelId="language-select"
                  />
                  <Field
                    fullWidth
                    name="amount"
                    type="number"
                    as={FormikTextField}
                    label="訂單金額"
                  />
                  <Field
                    fullWidth
                    name="tradeLimit"
                    type="number"
                    as={FormikTextField}
                    label="交易限制秒數"
                    helperText="60 <= x <= 900，0 則不啟用交易限制秒數"
                  />
                  <FormikDatePickerField
                    disablePast
                    name="expireDate"
                    label="繳費有效期限"
                    helperText="x <= 180"
                  />
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Box>
                    <FormikCheckboxField
                      name="enableCredit"
                      label="是否支援信用卡"
                    />
                    <FormikCheckboxField
                      name="enableWebATM"
                      label="是否支援 WebATM"
                    />
                    <FormikCheckboxField
                      name="enableVacc"
                      label="是否支援轉帳"
                    />
                    <FormikCheckboxField
                      name="returnNewebpayAfterPaid"
                      label="成功繳費後回系統頁面"
                    />
                    <FormikCheckboxField
                      name="returnNewebpayAfterTicketGot"
                      label="成功取號後回系統頁面"
                    />
                    <FormikCheckboxField
                      name="showReturnButton"
                      label="是否於藍新交易頁面顯示返回鈕"
                    />
                    <FormikCheckboxField
                      name="modifyEmail"
                      label="付款人是否可於付款頁面修改 Email"
                    />
                  </Box>
                  <Field
                    fullWidth
                    name="email"
                    type="email"
                    as={FormikTextField}
                    label="Email"
                    helperText="通知付款人使用"
                  />
                  <Field
                    fullWidth
                    name="description"
                    as={FormikTextField}
                    helperText="長度限制 50 字元，勿使用特殊符號"
                    label="商品資訊"
                  />
                  <Field
                    fullWidth
                    name="orderComment"
                    as={FormikTextField}
                    helperText="長度限制 300 字元"
                    label="商店備註"
                  />
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Box
                    component="pre"
                    sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
                  >
                    {JSON.stringify(
                      transformValuesToPayload(values as Values),
                      null,
                      2
                    )}
                  </Box>
                  <Button type="submit" variant="contained">
                    成立訂單
                  </Button>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                {newebpayForm && (
                  <Stack spacing={1}>
                    <Box
                      component="pre"
                      sx={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
                    >
                      {JSON.stringify(newebpayForm, null, 2)}
                    </Box>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={() => {
                        const { tradeInfoRaw, ...payload } = newebpayForm
                        formPost(mpgGateway, payload)
                      }}
                    >
                      前往付款
                    </Button>
                  </Stack>
                )}
              </Grid>
            </Grid>
          )}
        </Formik>
      </LocalizationProvider>
    </Container>
  )
}

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {
    title: 'Create an order',
    mpgGateway: process.env.MPG_GATEWAY,
  },
})

export default CreateOrder
