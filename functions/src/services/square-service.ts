import { Client, Environment, Order, Payment, Error as SquareError } from 'square';
import { Location } from 'square/dist/types/models/location';
import { isEmpty } from '../common/utils';
import { SalesSummary } from '../models/franchise';
import { DateTime } from 'luxon';

const enum LocationStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

// const enum OrderState {
//   Completed = 'COMPLETED',
//   Open = 'OPEN',
//   Cancelled = 'CANCELED',
//   Draft = 'DRAFT'
// }

export class SquareService {
  private static instance: SquareService;
  private squareClient: Client;
  private accessToken = process.env.SQUARE_ACCESS_TOKEN as string;
  private timezone = 'America/Denver';

  private constructor() {
    this.squareClient = new Client({
      bearerAuthCredentials: {
        accessToken: this.accessToken
      },
      environment: Environment.Production
    });
  }

  public static getInstance(): SquareService {
    if (!SquareService.instance) {
      SquareService.instance = new SquareService();
    }

    return SquareService.instance;
  }

  /* Locations API */
  listLocations = async (): Promise<Location[]> => {
    const { locationsApi } = this.squareClient;

    const response = await locationsApi.listLocations();

    const activeLocations = response.result.locations?.filter((location) => location.status === LocationStatus.Active) || [];

    return activeLocations || [];
  };

  getLocation = async (locationId: string): Promise<Location | undefined> => {
    const { locationsApi } = this.squareClient;

    const response = await locationsApi.retrieveLocation(locationId);

    return response.result.location;
  };

  getGrossSales = async (locationId: string, startDate: Date, endDate: Date): Promise<SalesSummary> => {
    const startDateInMST = DateTime.fromObject(
      { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate(), hour: 0, minute: 0, second: 0 },
      { zone: this.timezone }
    );
    const endDateInMST = DateTime.fromObject(
      { year: endDate.getFullYear(), month: endDate.getMonth() + 1, day: endDate.getDate(), hour: 23, minute: 59, second: 59 },
      { zone: this.timezone }
    );

    const startDateInUTC = startDateInMST.toISO();
    const endDateInUTC = endDateInMST.toISO();

    console.log(`Fetching sales data for location ${locationId} from ${startDateInUTC} to ${endDateInUTC}.`);

    let grossSales = 0;
    let serviceCharges = 0;
    let returns = 0;
    let discounts = 0;
    let taxes = 0;
    let tips = 0;
    let roundingAdjustments = 0;
    let giftCardSales = 0;
    let fees = 0;

    let cash = 0;
    let card = 0;
    let giftCard = 0;
    let other = 0;

    const channelRevenue: Record<string, number> = {};
    const externalSources: Record<string, number> = {};

    try {
      let ordersResult = await this.searchOrders(locationId, startDateInUTC, endDateInUTC);

      if (!isEmpty(ordersResult.orders)) {
        for (const order of ordersResult.orders) {
          grossSales += Number(order.totalMoney?.amount || 0);
          discounts += Number(order.totalDiscountMoney?.amount || 0);
          taxes += Number(order.totalTaxMoney?.amount || 0);
          tips += Number(order.totalTipMoney?.amount || 0);
          roundingAdjustments += Number(order.roundingAdjustment?.amountMoney?.amount || 0);

          if (order.serviceCharges) {
            for (const charge of order.serviceCharges) {
              serviceCharges += Number(charge.totalMoney?.amount || 0);
            }
          }

          if (order.lineItems) {
            for (const item of order.lineItems) {
              if (item.name?.toLowerCase().includes('gift card')) {
                giftCardSales += Number(item.totalMoney?.amount || 0);
              }
            }
          }

          if (order.refunds) {
            for (const refund of order.refunds) {
              returns += Number(refund.amountMoney?.amount || 0);
            }
          }

          const channel = order.source?.name || 'Unknown';
          const totalMoney = Number(order.totalMoney?.amount || 0);
          channelRevenue[channel] = (channelRevenue[channel] || 0) + totalMoney;
        }
      } else {
        console.log('Error fetching orders: ', ordersResult.errors);
      }

      let paymentsResult = await this.searchPayments(locationId, startDateInUTC, endDateInUTC);

      if (!isEmpty(paymentsResult.payments)) {
        for (const payment of paymentsResult.payments) {
          if (payment.processingFee) {
            for (const fee of payment.processingFee) {
              fees += Number(fee.amountMoney?.amount || 0);
            }
          }

          const sourceType = payment.sourceType?.toUpperCase() || '';
          const totalMoney = Number(payment.amountMoney?.amount || 0);

          switch (sourceType) {
            case 'CARD':
            case 'CREDIT_CARD':
            case 'DEBIT_CARD':
            case 'OTHER_CARD':
              card += totalMoney;
              break;
            case 'CASH':
              cash += totalMoney;
              break;
            case 'THIRD_PARTY_CARD':
            case 'GIFT_CARD':
              giftCard += totalMoney;
              break;
            case 'EXTERNAL':
              const externalSource = payment.externalDetails?.source || 'Unknown';
              externalSources[externalSource] = (externalSources[externalSource] || 0) + totalMoney;
              break;
            default:
              other += totalMoney;
          }
        }
      } else {
        console.log('Error fetching payments: ', paymentsResult.errors);
      }
    } catch (error) {
      console.error(error);
      throw new Error('An error occurred while fetching sales data.');
    }

    Object.keys(channelRevenue).forEach((key) => {
      channelRevenue[key] = channelRevenue[key] / 100;
    });

    Object.keys(externalSources).forEach((key) => {
      externalSources[key] = externalSources[key] / 100;
    });

    const totalCollected = grossSales + taxes + tips + roundingAdjustments + giftCardSales;
    const netTotal = totalCollected - fees;
    const royalties = (grossSales + serviceCharges + returns + discounts) * 0.06;
    const marketingFees = (grossSales + serviceCharges + returns + discounts) * 0.02;

    return {
      test: grossSales / 100,
      grossSales: (grossSales + serviceCharges) / 100,
      items: (grossSales - serviceCharges) / 100,
      serviceCharges: serviceCharges / 100,
      returns: returns / 100,
      discounts: discounts / 100,
      netSales: (grossSales - returns - discounts) / 100,
      taxes: taxes / 100,
      tips: tips / 100,
      roundingAdjustments: roundingAdjustments / 100,
      giftCardSales: giftCardSales / 100,
      totalCollected: totalCollected / 100,
      cash: cash / 100,
      card: card / 100,
      giftCard: giftCard / 100,
      other: other / 100,
      channelRevenue,
      externalSources,
      fees: fees / 100,
      netTotal: netTotal / 100,
      royalties: royalties / 100,
      marketingFees: marketingFees / 100
    };
  };

  private searchOrders = async (
    locationId: string,
    startDate: string | null,
    endDate: string | null
  ): Promise<{ orders: Order[]; errors: SquareError[] }> => {
    if (!startDate || !endDate) {
      throw new Error('Invalid date range.');
    }

    console.log(`Fetching orders for location ${locationId} from ${startDate} to ${endDate}.`);

    const { ordersApi } = this.squareClient;

    const limit = 500;

    let orders: Order[] = [];
    let currentCursor = undefined;
    let errors: SquareError[] = [];

    do {
      const response = await ordersApi.searchOrders({
        limit,
        cursor: currentCursor,
        locationIds: [locationId],
        query: {
          filter: {
            dateTimeFilter: {
              closedAt: {
                startAt: startDate,
                endAt: endDate
              }
            }
          }
        }
      });

      orders = orders.concat(response.result.orders || []);
      currentCursor = response.result.cursor;
      errors = errors.concat(response.result.errors || []);
    } while (currentCursor);

    return {
      orders,
      errors
    };
  };

  private searchPayments = async (
    locationId: string,
    startDate: string | null,
    endDate: string | null
  ): Promise<{ payments: Payment[]; errors: SquareError[] }> => {
    if (!startDate || !endDate) {
      throw new Error('Invalid date range.');
    }

    console.log(`Fetching payments for location ${locationId} from ${startDate} to ${endDate}.`);

    const { paymentsApi } = this.squareClient;

    const limit = 500;

    let payments: Payment[] = [];
    let currentCursor = undefined;
    let errors: SquareError[] = [];

    do {
      const response = await paymentsApi.listPayments(
        startDate,
        endDate,
        undefined,
        currentCursor,
        locationId,
        undefined,
        undefined,
        undefined,
        limit
      );

      payments = payments.concat(response.result.payments || []);
      currentCursor = response.result.cursor;
      errors = errors.concat(response.result.errors || []);
    } while (currentCursor);

    return {
      payments,
      errors
    };
  };
}
