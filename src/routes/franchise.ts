import { Router, Request, Response } from 'express';
import { SquareService } from '../services/square-service';
import { requireAuth } from '@clerk/express';

export const franchiseRouter = Router();

const squareService = SquareService.getInstance();

franchiseRouter.get('/', requireAuth(), async (req: Request, res: Response) => {
    try {
        console.log(`User ID: ${req.auth?.userId} is fetching franchises.`);

        const franchises = await squareService.listLocations();

        res.status(200).send(franchises);
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred.');
        }
    }
});

franchiseRouter.get('/:locationId', requireAuth(), async (req: Request, res: Response) => {
    try {
        console.log(`User ID: ${req.auth?.userId} is fetching franchise ${req.params.locationId}.`);

        const { locationId } = req.params;
        const franchise = await squareService.getLocation(locationId);

        if (franchise) {
            res.status(200).send(franchise);
        } else {
            res.status(404).send('Franchise not found.');
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred.');
        }
    }
});

franchiseRouter.get('/:locationId/royalties', requireAuth(), async (req: Request, res: Response) => {
    try {
        console.log(`User ID: ${req.auth?.userId} is fetching royalties for franchise ${req.params.locationId} for the date range ${req.query.startDate} to ${req.query.endDate}.`);

        const { locationId } = req.params;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const grossSales = await squareService.getGrossSales(locationId, startDate, endDate);
        const royalties = parseFloat((grossSales * 0.06).toFixed(2));
        const marketingFees = parseFloat((grossSales * 0.02).toFixed(2));

        res.status(200).send({
            grossSales,
            royalties,
            marketingFees
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(500).send(error.message);
        } else {
            res.status(500).send('An unknown error occurred.');
        }
    }
});
