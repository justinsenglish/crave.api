import { Client, Environment, Order } from 'square';
import { Location } from 'square/dist/types/models/location';
import { isEmpty } from '../common/utils';

const enum LocationStatus {
    Active = 'ACTIVE',
    Inactive = 'INACTIVE'
}

const enum OrderState {
    Completed = 'COMPLETED'
}

export class SquareService {
    private static instance: SquareService;
    private squareClient: Client;
    private accessToken = process.env.SQUARE_ACCESS_TOKEN as string;

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

    getGrossSales = async (locationId: string, startDate: string, endDate: string): Promise<number> => {
        let grossSales = 0;

        let result = await this.searchOrders(locationId, startDate, endDate);

        while (!isEmpty(result.orders)) {
            for (const order of result.orders) {
                grossSales += Number(order.totalMoney?.amount) || 0;
            }

            if (result.cursor) {
                result = await this.searchOrders(locationId, startDate, endDate, result.cursor);
            } else {
                break;
            }
        }

        return grossSales / 100; // Convert from cents to dollars
    };

    private searchOrders = async (locationId: string, startDate: string, endDate: string, cursor?: string): Promise<{ orders: Order[]; cursor: string | undefined }> => {
        const { ordersApi } = this.squareClient;

        const limit = 500;

        const orders = await ordersApi.searchOrders({
            limit,
            cursor,
            locationIds: [locationId],
            query: {
                filter: {
                    dateTimeFilter: {
                        closedAt: {
                            startAt: startDate,
                            endAt: endDate
                        }
                    },
                    stateFilter: {
                        states: [OrderState.Completed]
                    }
                },
                sort: {
                    sortField: 'CLOSED_AT',
                    sortOrder: 'ASC'
                }
            }
        });

        return {
            orders: orders.result.orders || [],
            cursor: orders.result.cursor
        };
    };
}
