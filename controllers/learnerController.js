import Learner from '../models/Learner.js';
import { validationResult } from 'express-validator';

// GET /profile - Display profile edit form
export const editProfile = async (req, res) => {
  try {
    const learner = await Learner.findById(req.session.userId);

    if (!learner) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    res.render('profile/edit', {
      title: 'Edit Profile',
      errors: [],
      learner,
      oldInput: {
        name: learner.name,
        email: learner.email,
        targetLanguage: learner.targetLanguage,
        nativeLanguage: learner.nativeLanguage,
        interests: learner.interests
      }
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    req.flash('error', 'Could not load profile');
    res.redirect('/');
  }
};

// PUT /profile - Update profile
export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    const learner = await Learner.findById(req.session.userId);

    if (!learner) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    if (!errors.isEmpty()) {
      return res.status(400).render('profile/edit', {
        title: 'Edit Profile',
        errors: errors.array(),
        learner,
        oldInput: req.body
      });
    }

    const { name, email, targetLanguage, nativeLanguage, interests } = req.body;

    // Check if email changed and already exists
    if (email !== learner.email) {
      const existingUser = await Learner.findOne({ email });
      if (existingUser) {
        return res.status(400).render('profile/edit', {
          title: 'Edit Profile',
          errors: [{ msg: 'An account with this email already exists' }],
          learner,
          oldInput: req.body
        });
      }
    }

    // Update fields
    learner.name = name;
    learner.email = email;
    learner.targetLanguage = targetLanguage;
    learner.nativeLanguage = nativeLanguage;
    learner.interests = interests || '';

    await learner.save();

    req.flash('success', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    req.flash('error', 'Could not update profile');
    res.redirect('/profile');
  }
};

// PUT /profile/password - Update password
export const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    const learner = await Learner.findById(req.session.userId).select('+password');

    if (!learner) {
      req.flash('error', 'User not found');
      return res.redirect('/');
    }

    if (!errors.isEmpty()) {
      return res.status(400).render('profile/edit', {
        title: 'Edit Profile',
        errors: errors.array(),
        learner,
        oldInput: req.body
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isMatch = await learner.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).render('profile/edit', {
        title: 'Edit Profile',
        errors: [{ msg: 'Current password is incorrect' }],
        learner,
        oldInput: req.body
      });
    }

    // Update password
    learner.password = newPassword;
    await learner.save();

    req.flash('success', 'Password updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating password:', error);
    req.flash('error', 'Could not update password');
    res.redirect('/profile');
  }
};
