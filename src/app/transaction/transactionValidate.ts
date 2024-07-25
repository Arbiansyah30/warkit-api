import { MESSAGE_CODE } from "../../utils/ErrorCode";
import { AppError } from "../../utils/HttpError";
import { MESSAGES } from "../../utils/Messages";
import { REGEX } from "../../utils/Regex";
import { getProductById } from "../product/productRepo";
import { TransactionBodyDTO, TransactionDetailDTO } from "./transactionDTO";
import {
  getTransactionById,
  getTransactionDetailById,
} from "./transactionRepo";
// import { getProductById, getProductByName } from "./transactionRepo"

export const createTransactionValidate = async ({
  email,
  name,
  paymentMethod,
  details,
}: TransactionBodyDTO) => {
  if (!email) {
    return AppError(
      MESSAGES.ERROR.REQUIRED.EMAIL,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }

  if (!REGEX.email.test(email)) {
    return AppError(MESSAGES.ERROR.INVALID.USER.EMAIL, 400, MESSAGE_CODE.BAD_REQUEST)
  }

  if (!name) {
    return AppError(
      MESSAGES.ERROR.REQUIRED.NAME,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }
  if (!paymentMethod) {
    return AppError(
      MESSAGES.ERROR.REQUIRED.NAME,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }

  if (((details?.length as number) < 1) || !details) {
    return AppError(
      MESSAGES.ERROR.INVALID.PRODUCT_ITEM,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }

  const productDetails = await Promise.all(
    (details as TransactionDetailDTO[]).map((item) =>
      getProductById(item.productId)
    )
  );
  const hasInvalidProduct = productDetails.some((product) => product === null);

  if (hasInvalidProduct) {
    return AppError(
      MESSAGES.ERROR.NOT_FOUND.PRODUCT,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }

  // if (findName) {
  //     // unlinkSync(`./src/images/products/${image}`)
  //     return AppError(MESSAGES.ERROR.ALREADY.PRODUCT, 400, MESSAGE_CODE.BAD_REQUEST)
  // }
};

export const createTransactionDetailValidate = async (
  details: TransactionDetailDTO[]
) => {
  const promises = details.map(async (item) => {
    const getProduct = await getProductById(item?.productId);
    return (item?.quantity as number) > (getProduct?.stock as number);
  });
  const result = await Promise.all(promises);
  const findMinus = result.find((item) => item === true);
  if (findMinus) {
    return AppError(
      MESSAGES.ERROR.INVALID.TRANSACTION_ORDER,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }
};

export const updateStatusToPaidTransactionValidate = async (id: string) => {
  const findTransaction = await getTransactionById(id as string);
  if (!findTransaction) {
    return AppError(
      MESSAGES.ERROR.NOT_FOUND.TRANSACTION,
      404,
      MESSAGE_CODE.NOT_FOUND
    );
  }
  const promises = findTransaction.transactionDetails.map(async (item) => {
    const getById = await getTransactionDetailById(item.id);
    const getProduct = await getProductById(getById?.productId);

    return (getProduct?.stock as number) < (getById?.quantity as number);
  });
  const result = await Promise.all(promises);
  const findMinus = result.find((item) => item === true);
  if (findMinus) {
    return AppError(
      MESSAGES.ERROR.INVALID.TRANSACTION_ORDER,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }
};

export const updatePaymentTransactionValidate = async (
  id: string,
  totalPaid: number
) => {
  const findTransaction = await getTransactionById(id as string);
  if (!findTransaction) {
    return AppError(
      MESSAGES.ERROR.NOT_FOUND.TRANSACTION,
      404,
      MESSAGE_CODE.NOT_FOUND
    );
  }

  const totalAmount = findTransaction?.totalAmount as number;
  if (totalPaid < totalAmount) {
    return AppError(
      MESSAGES.ERROR.PAYMENT.PAYMENT_MONEY,
      400,
      MESSAGE_CODE.BAD_REQUEST
    );
  }
};

// export const updateProductValidate = async ({ name, id, image }: ProductBodyDTO, size: number) => {
//     const findUnique = await getProductById(id)
//     if (!findUnique) {
//         return AppError(MESSAGES.ERROR.NOT_FOUND.PRODUCT, 404, MESSAGE_CODE.NOT_FOUND)
//     }

//     const findProduct = await getProductByName({ name })

//     if (name && findProduct && findUnique && findProduct.id !== findUnique.id) {
//         return AppError(MESSAGES.ERROR.ALREADY.PRODUCT, 400, MESSAGE_CODE.BAD_REQUEST)
//     }

//     if (size > 5242880) {
//         unlinkSync(image as string)
//         return AppError(MESSAGES.ERROR.INVALID.IMAGE_SIZE, 400, MESSAGE_CODE.BAD_REQUEST)
//     }
// }

// export const deleteProductValidate = async (id: string) => {
//     const findUnique = await getProductById(id)
//     if (!findUnique) {
//         return AppError(MESSAGES.ERROR.NOT_FOUND.PRODUCT, 404, MESSAGE_CODE.NOT_FOUND)
//     }
// }
