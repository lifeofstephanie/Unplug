import { Request, Response, NextFunction } from "express";
import Joi from "joi";

/**
 * Middleware factory — validates req.body against a Joi schema.
 * Usage: router.post("/route", validate(mySchema), controller)
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      res.status(400).json({ error: "Validation failed", details: messages });
      return;
    }

    req.body = value;
    next();
  };
};
