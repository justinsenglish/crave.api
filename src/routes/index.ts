import { Router } from 'express';
import { franchiseRouter } from './franchise';

export const routes = Router();

routes.get('/', (_req, res) => {
    res.status(200).json({
        message: 'Hello World!'
    });
});

routes.use('/franchises', franchiseRouter);
