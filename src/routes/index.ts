import { Router } from 'express';
import { franchiseRouter } from './franchise';

export const routes = Router();

routes.get('/', (_req, res) => {
    res.status(200);
});

routes.use('/franchises', franchiseRouter);
