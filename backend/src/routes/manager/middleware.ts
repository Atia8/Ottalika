import { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Demo: Set manager ID
  (req as any).managerId = 1;
  next();
};

export const authorizeManager = (req: Request, res: Response, next: NextFunction) => {
  next();
};