// import { Request, Response } from 'express';
// import { pool } from '../database/db';

// interface AuthRequest extends Request {
//   user?: {
//     userId: string;
//     role: string;
//   };
// }

// // Get all complaints for owner dashboard
// export const getOwnerComplaints = async (req: AuthRequest, res: Response) => {
//   try {
//     // 1. Get all complaints along with renter and resolution info
//     const query = `
//       SELECT 
//         c.id AS complaint_id,
//         c.title,
//         c.description,
//         c.category,
//         c.priority,
//         c.apartment_id,
//         a.apartment_number,
//         r.name AS renter_name,
//         c.created_at AS created_at,
//         cr.manager_confirmed,
//         cr.renter_confirmed,
//         cr.resolved_at
//       FROM complaints c
//       JOIN apartments a ON c.apartment_id = a.id
//       JOIN renters r ON c.renter_id = r.id
//       LEFT JOIN complaint_resolution cr ON c.id = cr.complaint_id
//       ORDER BY c.created_at DESC
//     `;
    
//     const { rows } = await pool.query(query);

//     // 2. Map rows to frontend-friendly format
//     const complaints = rows.map(row => {
//       let status: 'pending' | 'in-progress' | 'resolved' = 'pending';

//       if (row.manager_confirmed && !row.renter_confirmed) {
//         status = 'in-progress';
//       } else if (row.manager_confirmed && row.renter_confirmed) {
//         status = 'resolved';
//       }

//       return {
//         id: row.complaint_id,
//         title: row.title,
//         description: row.description,
//         category: row.category,
//         priority: row.priority,
//         apartment: row.apartment_number,
//         renterName: row.renter_name,
//         createdAt: row.created_at,
//         resolvedAt: row.resolved_at,
//         status,
//       };
//     });

//     res.json({
//       success: true,
//       data: complaints,
//     });
//   } catch (error) {
//     console.error('Error fetching owner complaints:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch complaints',
//     });
//   }
// };


 import { Request, Response } from 'express';
 import { pool } from '../database/db';


interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}


 export const getOwnerComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM get_owner_complaints();'
    );

    // Same JS mapping logic as before
    const complaints = rows.map(row => {
      let status: 'pending' | 'in-progress' | 'resolved' = 'pending';

      if (row.manager_confirmed && !row.renter_confirmed) {
        status = 'in-progress';
      } else if (row.manager_confirmed && row.renter_confirmed) {
        status = 'resolved';
      }

      return {
        id: row.complaint_id,
        title: row.title,
        description: row.description,
        category: row.category,
        priority: row.priority,
        apartment: row.apartment_number,
        renterName: row.renter_name,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at,
        status,
      };
    });

    res.json({ success: true, data: complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};
