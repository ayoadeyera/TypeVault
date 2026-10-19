/* ==========================================================================
   Type Station - Main Index & Content Routes
   A Product of PluralTech LTD
   ========================================================================== */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../db/index.js';

const router = express.Router();

// GET / - Practice Arena
router.get('/', (req, res) => {
  res.render('pages/index', {
    title: 'Type Station — Precision Typing & Syntax Training for Developers',
    activePage: 'arena',
    user: req.session?.user || null
  });
});

// GET /about - About Us
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: 'About Us — Type Station by PluralTech LTD',
    activePage: 'about',
    user: req.session?.user || null
  });
});

// GET /contact - Contact Us
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Support — Type Station by PluralTech LTD',
    activePage: 'contact',
    user: req.session?.user || null,
    errors: [],
    successMessage: null,
    formData: {}
  });
});

// POST /contact - Handle contact form with express-validator
router.post(
  '/contact',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Please enter your full name.'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address.')
      .normalizeEmail(),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Please select or enter a subject for your inquiry.'),
    body('message')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Your message must be at least 10 characters long.')
      .escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { name, email, subject, message } = req.body;

    if (!errors.isEmpty()) {
      return res.status(400).render('pages/contact', {
        title: 'Contact Support — Type Station by PluralTech LTD',
        activePage: 'contact',
        user: req.session?.user || null,
        errors: errors.array(),
        successMessage: null,
        formData: { name, email, subject, message }
      });
    }

    try {
      await query(
        'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)',
        [name, email, subject, message]
      );
    } catch (dbErr) {
      console.warn('[Contact Note] Could not save message to DB:', dbErr.message);
    }

    return res.render('pages/contact', {
      title: 'Contact Support — Type Station by PluralTech LTD',
      activePage: 'contact',
      user: req.session?.user || null,
      errors: [],
      successMessage: 'Thank you for reaching out! The PluralTech LTD team has received your message and will respond shortly.',
      formData: {}
    });
  }
);

// GET /privacy - Privacy Policy
router.get('/privacy', (req, res) => {
  res.render('pages/privacy', {
    title: 'Privacy Policy — Type Station by PluralTech LTD',
    activePage: 'privacy',
    user: req.session?.user || null
  });
});

// GET /terms - Terms & Conditions
router.get('/terms', (req, res) => {
  res.render('pages/terms', {
    title: 'Terms & Conditions — Type Station by PluralTech LTD',
    activePage: 'terms',
    user: req.session?.user || null
  });
});

// GET /disclaimer - Disclaimer
router.get('/disclaimer', (req, res) => {
  res.render('pages/disclaimer', {
    title: 'Disclaimer — Type Station by PluralTech LTD',
    activePage: 'disclaimer',
    user: req.session?.user || null
  });
});

export default router;
