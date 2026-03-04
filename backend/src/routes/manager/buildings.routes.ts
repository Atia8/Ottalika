import { Router } from 'express';
import { dbQuery } from './utils';

const router = Router();

// GET /buildings - Get all buildings
router.get('/buildings', async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT id, name FROM buildings ORDER BY name
    `);
    
    res.json({
      success: true,
      data: { buildings: result.rows }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch buildings' });
  }
});

// GET /buildings/:id/available-apartments
router.get('/buildings/:id/available-apartments', async (req, res) => {
  try {
    const buildingId = parseInt(req.params.id);
    const result = await dbQuery(`
      SELECT id, apartment_number, floor, rent_amount 
      FROM apartments 
      WHERE building_id = $1 AND status = 'vacant'
      ORDER BY apartment_number
    `, [buildingId]);
    
    res.json({
      success: true,
      data: { apartments: result.rows }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch apartments' });
  }
});

export default router;