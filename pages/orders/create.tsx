import { LocalizationProvider } from '@mui/lab'
import DateAdapter from '@mui/lab/AdapterDateFns'
import { Container } from '@mui/material'
import { GetServerSideProps, NextPage } from 'next'
import NormalPayForm from '../../components/NormalPayForm'

const CreateOrder: NextPage<{ mpgGateway: string }> = ({ mpgGateway }) => {
  return (
    <Container sx={{ py: 2 }}>
      <LocalizationProvider dateAdapter={DateAdapter}>
        <NormalPayForm mpgGateway={mpgGateway} />
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
