import { Box, Button, ButtonGroup, TextField } from '@mui/material'
import axios from 'axios'
import { FC, useRef } from 'react'
import { OrderCloseType } from '../models/Order'

interface Props {
  orderId: string
  onSuccess: () => void
}

const CloseOrder: FC<Props> = ({ orderId, onSuccess }) => {
  const fundBtnRef = useRef<HTMLButtonElement>(null)
  const refundBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', mt: 1, columnGap: 1 }}
      component="form"
      onSubmit={(event: any) => {
        event.preventDefault()
        const { submitter } = event.nativeEvent
        let orderCloseType: OrderCloseType
        if (submitter === fundBtnRef.current) {
          orderCloseType = OrderCloseType.Fund
        } else if (submitter === refundBtnRef.current) {
          orderCloseType = OrderCloseType.Refund
        } else {
          return
        }
        axios
          .post(`/api/v1/orders/${orderId}/close`, {
            closeType: orderCloseType,
            amount: Number(inputRef.current!.value),
          })
          .then(onSuccess)
          .catch((error) => {
            console.error(error)
          })
      }}
    >
      <TextField inputRef={inputRef} size="small" type="number" />
      <ButtonGroup variant="contained">
        <Button ref={fundBtnRef} type="submit">
          請款
        </Button>
        <Button ref={refundBtnRef} type="submit">
          退款
        </Button>
      </ButtonGroup>
    </Box>
  )
}

export default CloseOrder
