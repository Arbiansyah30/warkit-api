import { StatusTransaction } from "@prisma/client";
import { type Request, type Response } from "express";
import { MESSAGE_CODE } from "../../utils/ErrorCode";
import { HandleResponse } from "../../utils/HandleResponse";
import { HttpError } from "../../utils/HttpError";
import { MESSAGES } from "../../utils/Messages";
import { ProductBodyDTO } from "../product/productDTO";
import {
  deleteProductService,
  updateProductService,
} from "../product/productService";
import { createMidtransTransaction } from "./midtransService";
// import { printTransactionService } from "./printService";
// import { printCustomerReceipt } from "./printThermalService";
import {
  TransactionBodyDTO,
  TransactionDetailDTO,
  WebhookMidtransTransactionBodyDTO,
} from "./transactionDTO";
import {
  UpdatePaymentTransactionService,
  UpdateToPaidTransactionService,
  cancelTransactionService,
  createTransactionService,
  customUpdateStatusTransactionService,
  getHistoryByTransactionIdService,
  getMonthTransactionService,
  getTodayTransactionService,
  getTransactionByIdService,
  getTransactionDetailByTransactionIdService,
  getTransactionService,
  getWeekTransactionService,
  handleWebhookTransactionService,
} from "./transactionService";
import { IFilterTransaction } from "./transactionTypes";

export const createTransactionController = async (
  req: Request,
  res: Response
) => {
  const { name, email, paymentMethod, details } =
    req.body as TransactionBodyDTO;

  const transactionCreation = await createTransactionService({
    details,
    email,
    name,
    paymentMethod,
  });

  if ((transactionCreation as HttpError)?.message) {
    return HandleResponse(
      res,
      (transactionCreation as HttpError).statusCode,
      (transactionCreation as HttpError).code,
      (transactionCreation as HttpError).message
    );
  }

  if (paymentMethod === "CASH") {
    return HandleResponse(
      res,
      201,
      MESSAGE_CODE.SUCCESS,
      MESSAGES.CREATED.TRANSACTION,
      transactionCreation
    );
  } else if (paymentMethod === "QRIS") {
    const midtransResponse = await createMidtransTransaction(
      transactionCreation as TransactionBodyDTO,
      details as TransactionDetailDTO[],
      name as string,
      email as string
    );
    console.log(midtransResponse);
    if ((midtransResponse as HttpError)?.message) {
      return HandleResponse(
        res,
        500,
        MESSAGE_CODE.INTERNAL_SERVER_ERROR,
        (midtransResponse as HttpError).message
      );
    }
    return HandleResponse(
      res,
      201,
      MESSAGE_CODE.SUCCESS,
      MESSAGES.CREATED.TRANSACTION,
      midtransResponse
    );
  } else {
    return HandleResponse(
      res,
      400,
      MESSAGE_CODE.BAD_REQUEST,
      "Invalid payment method"
    );
  }
};

export const getTransactionDetailsByTransactionIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { transactionId } = req.params;

    const products =
      await getTransactionDetailByTransactionIdService(transactionId);

    return HandleResponse(
      res,
      200,
      MESSAGE_CODE.SUCCESS,
      MESSAGES.SUCCESS.PRODUCT.GET,
      products
    );
  } catch (error) {
    return HandleResponse(
      res,
      500,
      MESSAGE_CODE.INTERNAL_SERVER_ERROR,
      MESSAGES.ERROR.INTERNAL_SERVER
    );
  }
};
export const getTransactionController = async (req: Request, res: Response) => {
  try {
    const { page, perPage, search, status, from, to } = req.query as IFilterTransaction;

    const transactionService = await getTransactionService({
      search,
      page: Number(page) || undefined,
      perPage: Number(perPage) || undefined,
      status: status as StatusTransaction || undefined,
      from: from ? from : undefined,
      to: to ? to : undefined,
    });

    return HandleResponse(
      res,
      200,
      MESSAGE_CODE.SUCCESS,
      MESSAGES.SUCCESS.TRANSACTION.GET,
      transactionService.data,
      transactionService.meta
    );
  } catch (error) {
    console.log(error);

    return HandleResponse(
      res,
      500,
      MESSAGE_CODE.INTERNAL_SERVER_ERROR,
      MESSAGES.ERROR.INTERNAL_SERVER
    );
  }
};

export const UpdateToPaidTransactionController = async (
  req: Request,
  res: Response
) => {
  const { transactionId } = req.params;
  const update = await UpdateToPaidTransactionService({
    id: transactionId as string,
  });
  if ((update as HttpError)?.message) {
    return HandleResponse(
      res,
      (update as HttpError).statusCode,
      (update as HttpError).code,
      (update as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.TRANSACTION.PAID
  );
};

export const getTransactionByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const getById = await getTransactionByIdService(id);
  if ((getById as HttpError)?.message) {
    return HandleResponse(
      res,
      (getById as HttpError).statusCode,
      (getById as HttpError).code,
      (getById as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.TRANSACTION.GET,
    getById
  );
};

export const getHistoryByTransactionIdController = async (
  req: Request,
  res: Response
) => {
  const { transactionId } = req.params;
  const getHistory = await getHistoryByTransactionIdService(transactionId);
  if ((getHistory as HttpError)?.message) {
    return HandleResponse(
      res,
      (getHistory as HttpError).statusCode,
      (getHistory as HttpError).code,
      (getHistory as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.HISTORY.GET,
    getHistory
  );
};

export const customUpdateStatusTransactionController = async (
  req: Request,
  res: Response
) => {
  const { transactionId } = req.params;
  const { status } = req.body;
  const updateStatus = await customUpdateStatusTransactionService(
    transactionId,
    status as StatusTransaction
  );
  if ((updateStatus as HttpError)?.message) {
    return HandleResponse(
      res,
      (updateStatus as HttpError).statusCode,
      (updateStatus as HttpError).code,
      (updateStatus as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.TRANSACTION.UPDATE_STATUS
  );
};

export const UpdatePaymentTransactionController = async (
  req: Request,
  res: Response
) => {
  const { transactionId } = req.params;
  const { totalPaid } = req.body;
  const updatePayment = await UpdatePaymentTransactionService(
    transactionId,
    totalPaid
  );
  if ((updatePayment as HttpError)?.message) {
    return HandleResponse(
      res,
      (updatePayment as HttpError).statusCode,
      (updatePayment as HttpError).code,
      (updatePayment as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.TRANSACTION.UPDATE
  );
};

export const handleWebhookTransactionController = async (
  req: Request,
  res: Response
) => {
  const {
    order_id,
    settlement_time,
    signature_key,
    transaction_status,
    gross_amount,
  } = req.body as WebhookMidtransTransactionBodyDTO;

  const paymentWebhook = await handleWebhookTransactionService(
    settlement_time as string,
    signature_key as string,
    order_id as string,
    transaction_status as string,
    Number(gross_amount)
  );

  if (!paymentWebhook) {
    return HandleResponse(
      res,
      400,
      MESSAGE_CODE.BAD_REQUEST,
      MESSAGES.ERROR.PAYMENT.FAILED
    );
  }
  console.log({ paymentWebhook });
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.PAYMENT
  );
};

export const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, categoryId, price, stock } = req.body as ProductBodyDTO;
  const update = await updateProductService(
    { name, categoryId, price, id, stock },
    req
  );
  if ((update as HttpError)?.message) {
    return HandleResponse(
      res,
      (update as HttpError).statusCode,
      (update as HttpError).code,
      (update as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.PRODUCT.UPDATE
  );
};
export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const update = await deleteProductService(String(id));
  if ((update as HttpError)?.message) {
    return HandleResponse(
      res,
      (update as HttpError).statusCode,
      (update as HttpError).code,
      (update as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.PRODUCT.DELETE
  );
};

// export const printTransactionController = async (
//   req: Request,
//   res: Response
// ) => {
//   const { id } = req.body;
//   const print = await printTransactionService(String(id));
//   if ((print as HttpError)?.message) {
//     return HandleResponse(
//       res,
//       (print as HttpError).statusCode,
//       (print as HttpError).code,
//       (print as HttpError).message
//     );
//   }
//   return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.PRINT);
// };
// export const printReceiptController = async (
//   req: Request,
//   res: Response
// ) => {
//   const body = req.body as TransactionModelTypes;
//   const print = await printCustomerReceipt(body);
//   // if ((print as HttpError)?.message) {
//   //   return HandleResponse(
//   //     res,
//   //     (print as HttpError).statusCode,
//   //     (print as HttpError).code,
//   //     (print as HttpError).message
//   //   );
//   // }
//   return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.PRINT);
// };



export const getTodayTransactionController = async (req: Request, res: Response) => {
  const { page, perPage } = req.query
  const todayTransaction = await getTodayTransactionService({
    page: Number(page) || undefined,
    perPage: Number(perPage) || undefined,
  });

  return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.TRANSACTION.GET, todayTransaction.data, todayTransaction.meta);
}
export const getWeekTransactionController = async (req: Request, res: Response) => {
  const { page, perPage } = req.query
  const weekTrasaction = await getWeekTransactionService({
    page: Number(page) || undefined,
    perPage: Number(perPage) || undefined,
  });

  return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.TRANSACTION.GET, weekTrasaction.data, weekTrasaction.meta);
}

export const getMonthTransactionController = async (req: Request, res: Response) => {
  const { month } = req.params;
  const monthTransaction = await getMonthTransactionService(Number(month));

  return HandleResponse(res, 200, MESSAGE_CODE.SUCCESS, MESSAGES.SUCCESS.TRANSACTION.GET, monthTransaction);
}

export const cancelTransactioController = async (req: Request, res: Response) => {
  const { transactionId } = req.body;
  const cancel = await cancelTransactionService(transactionId);
  if ((cancel as HttpError)?.message) {
    return HandleResponse(
      res,
      (cancel as HttpError).statusCode,
      (cancel as HttpError).code,
      (cancel as HttpError).message
    );
  }
  return HandleResponse(
    res,
    200,
    MESSAGE_CODE.SUCCESS,
    MESSAGES.SUCCESS.TRANSACTION.CANCEL
  );
}