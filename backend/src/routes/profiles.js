const router = require('express').Router();
const pool = require('../db');
const { calculate } = require('../calculator');

// Save a new financial profile
router.post('/', async (req, res) => {
  const { profileName, grossSalary, bankNet, years } = req.body;

  const cleanProfileName =
    typeof profileName === 'string' ? profileName.trim() : '';

  if (!cleanProfileName) {
    return res.status(400).json({
      error: 'profileName is required',
    });
  }

  if (cleanProfileName.length > 100) {
    return res.status(400).json({
      error: 'profileName must not exceed 100 characters',
    });
  }

  if (!grossSalary || isNaN(grossSalary) || Number(grossSalary) <= 0) {
    return res.status(400).json({
      error: 'grossSalary must be a positive number',
    });
  }

  const parsedYears =
    years === undefined || years === null || years === ''
      ? 15
      : parseInt(years, 10);

  if (isNaN(parsedYears) || parsedYears < 1 || parsedYears > 15) {
    return res.status(400).json({
      error: 'years must be between 1 and 15',
    });
  }

  let parsedBankNet = null;

  if (bankNet !== undefined && bankNet !== null && bankNet !== '') {
    parsedBankNet = Number(bankNet);

    if (isNaN(parsedBankNet) || parsedBankNet <= 0) {
      return res.status(400).json({
        error: 'bankNet must be a positive number',
      });
    }
  }

  const result = calculate(
    Number(grossSalary),
    parsedBankNet,
    parsedYears
  );

  try {
    const queryResult = await pool.query(
      `
        INSERT INTO profiles (profile_name, years, result)
        VALUES ($1, $2, $3)
        RETURNING
          id,
          profile_name AS "profileName",
          years,
          result,
          created_at AS "createdAt"
      `,
      [cleanProfileName, parsedYears, result]
    );

    return res.status(201).json(queryResult.rows[0]);
  } catch (error) {
    console.error('Could not save profile:', error.message);

    return res.status(500).json({
      error: 'Could not save profile',
    });
  }
});

// Get all profiles
router.get('/', async (req, res) => {
  try {
    const queryResult = await pool.query(`
      SELECT
        id,
        profile_name AS "profileName",
        years,
        result,
        created_at AS "createdAt"
      FROM profiles
      ORDER BY created_at DESC
    `);

    return res.status(200).json(queryResult.rows);
  } catch (error) {
    console.error('Could not load profiles:', error.message);

    return res.status(500).json({
      error: 'Could not load profiles',
    });
  }
});

// Get one profile by ID
router.get('/:id', async (req, res) => {
  const profileId = Number(req.params.id);

  if (!Number.isInteger(profileId) || profileId <= 0) {
    return res.status(400).json({
      error: 'Profile ID must be a positive integer',
    });
  }

  try {
    const queryResult = await pool.query(
      `
        SELECT
          id,
          profile_name AS "profileName",
          years,
          result,
          created_at AS "createdAt"
        FROM profiles
        WHERE id = $1
      `,
      [profileId]
    );

    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Profile not found',
      });
    }

    return res.status(200).json(queryResult.rows[0]);
  } catch (error) {
    console.error('Could not load profile:', error.message);

    return res.status(500).json({
      error: 'Could not load profile',
    });
  }
});

module.exports = router;