import { Backdrop, CircularProgress } from '@mui/material'

const Loading = () => (
  <Backdrop open>
    <CircularProgress color="inherit" />
  </Backdrop>
)

export default Loading
