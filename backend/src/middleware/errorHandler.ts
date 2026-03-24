import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', { name: err.name, message: err.message });
  } else {
    console.error('Error:', err);
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid ID format.' });
    return;
  }

  if ((err as any).code === 11000) {
    res.status(409).json({ success: false, message: 'Duplicate entry detected.' });
    return;
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
