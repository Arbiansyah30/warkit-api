import { type Request, type Response } from 'express'
import { MESSAGE_CODE } from 'utils/ErrorCode'
import { HandleResponse } from 'utils/HandleResponse'
import { MESSAGES } from 'utils/Messages'
import { getIncomeService } from './incomeService'
import { IFilterIncome } from './incomeTypes'

export const getIncomeController = async (req: Request, res: Response) => {
    const { from, page, perPage, to } = req.query as IFilterIncome

    const incomes = await getIncomeService({
        from: from ? from : undefined,
        page: page ? Number(page) : undefined,
        perPage: perPage ? Number(perPage) : undefined,
        to: to ? to : undefined
    })

    return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.INCOME.GET, incomes.data, incomes.meta)
}