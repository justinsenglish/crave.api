import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (_request: Request, response: Response, _next: NextFunction) => {
  response.status(404).send();
};
