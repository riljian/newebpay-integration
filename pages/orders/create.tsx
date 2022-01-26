import { LocalizationProvider } from '@mui/lab'
import DateAdapter from '@mui/lab/AdapterDateFns'
import { Box, Container, Tab, Tabs } from '@mui/material'
import { GetServerSideProps, NextPage } from 'next'
import { useState } from 'react'
import AgreementPayForm from '../../components/AgreementPayForm'
import NormalPayForm from '../../components/NormalPayForm'

enum PayType {
  Normal,
  Agreement,
}

const CreateOrder: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  const [{ activeTab }, setState] = useState(() => ({
    // FIXME
    activeTab: PayType.Agreement,
  }))
  return (
    <Container sx={{ py: 2 }}>
      <LocalizationProvider dateAdapter={DateAdapter}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => {
            setState((s) => ({ ...s, activeTab: newValue }))
          }}
        >
          <Tab label="一般支付" value={PayType.Normal} />
          <Tab label="約定支付" value={PayType.Agreement} />
        </Tabs>
        <Box sx={{ mt: 4 }}>
          {activeTab === PayType.Normal && (
            <NormalPayForm mpgGateway={mpgGateway} />
          )}
          {activeTab === PayType.Agreement && <AgreementPayForm />}
        </Box>
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
