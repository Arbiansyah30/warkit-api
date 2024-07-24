import { StatusTransaction } from "@prisma/client";
import prisma from "../../config";
import { getProductById } from "../product/productRepo";
import {
  PaymentMethod,
  TransactionBodyDTO,
  TransactionDetailDTO,
} from "./transactionDTO";
import { IFilterTransaction } from "./transactionTypes";

export const createTransaction = async ({
  name,
  details,
  email,
  paymentMethod,
}: TransactionBodyDTO) => {
  // const totalAmount = details?.reduce((acc, curr) => (acc) + (curr?.amount * curr?.quantity as number), 0) as number
  const amounts = await Promise.all(
    details?.map(async (detail) => {
      const findProduct = await getProductById(detail.productId);
      return (findProduct?.price as number) * (detail?.quantity as number);
    }) || []
  );
  const totalAmount = amounts.reduce((acc, curr) => acc + curr, 0);
  const totalQuantity = details?.reduce(
    (acc, curr) => acc + (curr?.quantity as number),
    0
  ) as number;
  return await prisma.transaction.create({
    data: {
      name: name as string,
      email: email as string,
      paymentMethod: paymentMethod as PaymentMethod,
      totalAmount,
      totalQuantity,
      totalPaid: 0,
      totalReturn: 0,
      status: "UNPAID",
    },
  });
};

export const createTransactionDetail = async ({
  details,
}: TransactionBodyDTO) => {
  return await prisma.transactionDetail.createMany({
    data: details as TransactionDetailDTO[],
  });
};

export const getTransaction = async ({
  page,
  perPage,
  search,
  status,
  from, to
}: IFilterTransaction) => {

  return await prisma.transaction.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          },
        }
      ],
      AND: {
        status: status || undefined
      },
      createdAt: {
        gte: from,
        lte: to
        // equals: date
      },
    },
    include: {
      transactionDetails: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: perPage,
    skip: (Number(page) - 1) * Number(perPage),
  });
};

export const getAllTransaction = async ({

  search,
  status,
  from, to
}: IFilterTransaction) => {
  return await prisma.transaction.findMany({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          },
        }
      ],
      AND: {
        status: status || undefined
      },
      createdAt: {
        gte: from,
        lte: to
        // equals: date
      },
    },
    include: {
      transactionDetails: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    }
  });
}

export const getTransactionCount = async ({
  search,
  status,
  from, to
}: IFilterTransaction) => {
  return await prisma.transaction.count({
    where: {
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive'
          },
        }
      ],
      AND: {
        status: status || undefined
      },
      createdAt: {
        gte: from,
        lte: to
        // equals: date
      },
    },
  });
};

export const getTransactionDetailByTransactionId = async (
  transactionId: string
) => {
  return await prisma.transactionDetail.findMany({
    where: {
      transactionId,
    },
  });
};

export const updateStatusTransaction = async (
  transactionId: string,
  status: StatusTransaction,
  settlementTime?: string,
  signatureKey?: string,
  totalPaid?: number,
  totalAmount?: number,
) => {
  return await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: {
      status,
      totalPaid,
      totalReturn: (totalPaid as number) - (totalAmount as number),
      settlementTime: settlementTime ? settlementTime : null,
      signatureKey: signatureKey ? signatureKey : null,
    },
  });
};

export const getTransactionById = async (id: string) => {
  return await prisma.transaction.findUnique({
    where: {
      id,
    },
    include: {
      transactionDetails: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });
};

export const getTransactionDetailById = async (id: string) => {
  return await prisma.transactionDetail.findUnique({
    where: {
      id,
    },
  });
};

export const createHistoryBaseOnTransaction = async (
  transactionId: string,
  status: StatusTransaction
) => {
  return await prisma.history.create({
    data: {
      status,
      transactionId,
    },
  });
};

export const getHistoryByTransactionId = async (transactionId: string) => {
  return await prisma.history.findMany({
    where: {
      transactionId: transactionId,
    },
  });
};

export const createIncomeByTransaction = async (
  transactionId: string,
  nominal: number
) => {
  return await prisma.income.create({
    data: {
      nominal,
      transactionId,
    },
  });
};

export const updatePaymentTransaction = async (
  transactionId: string,
  totalPaid: number,
  totalAmount: number
) => {
  return await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: {
      totalPaid,
      totalReturn: totalPaid - totalAmount,
      status: "PAID",
      settlementTime: new Date().toISOString(),
    },
  });
}

export const getTodayTransaction = async ({ page, perPage }: IFilterTransaction) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999)

  return await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: perPage,
    skip: (Number(page) - 1) * Number(perPage),
  });
}
export const getTodayTransactionCount = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999)

  return await prisma.transaction.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export const getWeekTransaction = async ({ page, perPage }: IFilterTransaction) => {
  const now = new Date();
  const firstDayOfWeek = now.getDate() - now.getDay();
  const lastDayOfWeek = firstDayOfWeek + 6;

  const startOfWeek = new Date(now.setDate(firstDayOfWeek));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now.setDate(lastDayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999);

  return await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: perPage,
    skip: (Number(page) - 1) * Number(perPage),
  })
}
export const getWeekTransactionCount = async () => {
  const now = new Date();
  const firstDayOfWeek = now.getDate() - now.getDay();
  const lastDayOfWeek = firstDayOfWeek + 6;

  const startOfWeek = new Date(now.setDate(firstDayOfWeek));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(now.setDate(lastDayOfWeek));
  endOfWeek.setHours(23, 59, 59, 999);

  return await prisma.transaction.count({
    where: {
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    orderBy: {
      createdAt: 'desc'
    },

  })
}

export const getMonthTransaction = async (month: number) => {
  const now = new Date();
  const year = now.getFullYear();

  // Membuat tanggal awal dan akhir bulan
  const startOfMonth = new Date(year, month - 1, 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(year, month, 0); // Tanggal 0 berarti hari terakhir dari bulan sebelumnya
  endOfMonth.setHours(23, 59, 59, 999);

  return await prisma.income.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

export const cancelTransaction = async (id: string) => {
  return await prisma.transaction.update({
    where: {
      id
    },
    data: {
      status: 'CANCEL'
    }
  },)
}