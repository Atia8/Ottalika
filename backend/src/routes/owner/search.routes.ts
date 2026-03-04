import { Router } from "express";
import { pool } from "../../database/db";

const router = Router();

/*
Search managers by name
*/
router.get("/search-managers", async (req,res)=>{
   try{

      const { query } = req.query;

      if(!query){
         return res.json({
            success:true,
            data:[]
         });
      }

      const result = await pool.query(`
         SELECT
            id,
            name,
            'manager' as role
         FROM managers
         WHERE LOWER(name) LIKE LOWER($1)
         ORDER BY name
      `,[`%${query}%`]);

      res.json({
         success:true,
         data:result.rows
      });

   }catch(err:any){
      res.status(500).json({
         success:false,
         message:err.message
      });
   }
});

export default router;