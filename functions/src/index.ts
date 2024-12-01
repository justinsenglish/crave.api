// import { initializeApp } from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { routes } from './routes';
import { bigIntHandler } from './middleware/bigint-middleware';
import { notFoundHandler } from './middleware/not-found-middleware';
import { errorHandler } from './middleware/error-middleware';

// initializeApp();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use(bigIntHandler);

app.use('/', routes);

app.use(notFoundHandler);
app.use(errorHandler);

exports.api = onRequest(app);
