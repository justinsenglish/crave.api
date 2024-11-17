import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { bigIntHandler } from './middleware/bigint-middleware';
import { errorHandler } from './middleware/error-middleware';
import { notFoundHandler } from './middleware/not-found-middleware';
import { clerkMiddleware } from '@clerk/express';

/**
 * App Variables
 */
if (!process.env.PORT) {
    process.exit(1);
}

const PORT: number = parseInt(process.env.PORT as string, 10);

const app = express();

/**
 *  App Configuration
 */
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());
app.use(bigIntHandler);

app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Server Activation
 */
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
