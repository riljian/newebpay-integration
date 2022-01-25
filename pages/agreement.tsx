import { Button, Container, Stack, TextField, Typography } from '@mui/material'
import axios from 'axios'
import type { GetStaticProps, NextPage } from 'next'
import { FormEvent, useRef, useState } from 'react'
import { SupportedLanguage } from '../configs/newebpay'
import { ORDERS_RESULT_PATH } from '../configs/path'
import { formPost } from '../helpers'

const Agreement: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [{ agreement }, setState] = useState(() => ({ agreement: null }))
  return (
    <Container>
      <Stack
        py={2}
        spacing={1}
        component="form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          const email = inputRef.current!.value
          axios
            .get(`/api/v1/users/${email}`)
            .then(({ data }) => {
              setState((s) => ({ ...s, agreement: data }))
            })
            .catch(() =>
              axios
                .post('/api/v1/orders', {
                  LangType: SupportedLanguage.TRADITIONAL_CHINESE,
                  Amt: 10,
                  ItemDesc: '約定信用卡試刷',
                  P3D: 1,
                  Email: email,
                  TokenTerm: email,
                  CREDITAGREEMENT: 1,
                  OrderComment: '約定事項',
                  Version: '1.6',
                  ReturnURL: `${window.origin}${ORDERS_RESULT_PATH}`,
                })
                .then(({ data: { tradeInfoRaw, ...payload } }) => {
                  formPost(mpgGateway, payload)
                })
            )
            .catch((error) => {
              console.error(error)
            })
        }}
      >
        <TextField required type="email" label="Email" inputRef={inputRef} />
        <Button type="submit" variant="contained">
          約定信用卡
        </Button>
        {agreement && (
          <Typography>{JSON.stringify(agreement, null, 2)}</Typography>
        )}
      </Stack>
    </Container>
  )
}

export const getStaticProps: GetStaticProps = async () => ({
  props: {
    title: '約定信用卡',
    mpgGateway: process.env.MPG_GATEWAY,
  },
})

export default Agreement
