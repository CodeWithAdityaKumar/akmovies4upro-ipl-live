import { NextResponse } from 'next/server';
import db from '@/utils/db';

export async function GET(request) {
  try {
    // First check if the constraints already exist
    const checkResult = await db.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'teams'
      AND constraint_name IN ('teams_name_unique', 'teams_short_name_unique');
    `);

    // If constraints already exist, return success
    if (checkResult.rows.length === 2) {
      return NextResponse.json({
        success: true,
        message: 'Unique constraints already exist on the teams table.',
        existing: true
      });
    }

    // Add unique constraints to the teams table
    try {
      // Try to add both constraints at once
      await db.query(`
        ALTER TABLE teams 
        ADD CONSTRAINT teams_name_unique UNIQUE (name),
        ADD CONSTRAINT teams_short_name_unique UNIQUE (short_name);
      `);
    } catch (alterError) {
      // If that fails, try adding them one by one
      console.log('Error adding both constraints at once:', alterError.message);
      
      try {
        // Try to add name constraint
        await db.query(`
          ALTER TABLE teams 
          ADD CONSTRAINT teams_name_unique UNIQUE (name);
        `);
        console.log('Added name constraint');
      } catch (nameError) {
        if (!nameError.message.includes('already exists')) {
          console.error('Error adding name constraint:', nameError.message);
        }
      }
      
      try {
        // Try to add short_name constraint
        await db.query(`
          ALTER TABLE teams 
          ADD CONSTRAINT teams_short_name_unique UNIQUE (short_name);
        `);
        console.log('Added short_name constraint');
      } catch (shortNameError) {
        if (!shortNameError.message.includes('already exists')) {
          console.error('Error adding short_name constraint:', shortNameError.message);
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema updated successfully. Added unique constraints to team name and short_name.' 
    });
  } catch (error) {
    console.error('Error updating database schema:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update database schema', 
      error: error.message,
      hint: error.hint,
      code: error.code
    }, { status: 500 });
  }
}
