import { Request, Response } from "express";
import { pool } from "../database/db";

// Request Body Types
interface CreateRequestBody {
  renter_name: string;
  apartment: string;
  subject: string;
  message: string;
}

interface UpdateStatusBody {
  status: "pending" | "approved" | "rejected";
}

// Get All Requests
export const getAllRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        renter_name,
        apartment,
        subject,
        message,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at,
        TO_CHAR(updated_at, 'YYYY-MM-DD') AS updated_at
       FROM owner_requests
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create Request
export const createRequest = async (req: Request, res: Response) => {
  try {
    const {
      renter_name,
      apartment,
      subject,
      message,
      renter_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO owner_requests
      (renter_name, apartment, subject, message, status, renter_id)
      VALUES ($1,$2,$3,$4,'pending',$5)
      RETURNING *`,
      [renter_name, apartment, subject, message, renter_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};

// Update Status
export const updateStatus = async (
  req: Request<{ id: string }, {}, UpdateStatusBody>,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE owner_requests
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Request not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getRequestsByRenter = async (req: Request, res: Response) => {
  try {
    const { renter_id } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM owner_requests
       WHERE renter_id = $1
       ORDER BY created_at DESC`,
      [renter_id]
    );

    res.json(result.rows);

  } catch (error:any) {
    res.status(500).json({ error: error.message });
  }
};