import { Button, Container, Stack } from '@mui/material'
import type { GetStaticProps, NextPage } from 'next'
import Link from '../components/Link'
import { ORDERS_CREATE_PATH, ORDERS_MANAGE_PATH } from '../configs/path'

const Home: NextPage = () => (
  <Container
    sx={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Stack gap={1}>
      <Button component={Link} href={ORDERS_CREATE_PATH} variant="contained">
        建立訂單並付款
      </Button>
      <Button component={Link} href={ORDERS_MANAGE_PATH} variant="contained">
        管理訂單
      </Button>
    </Stack>
  </Container>
)

export const getStaticProps: GetStaticProps = async () => ({
  props: {
    title: 'Home',
  },
})

export default Home
