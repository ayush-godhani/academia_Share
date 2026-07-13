
const { db, auth } = require('../config/firebase');




const registerUser = async (req, res) => {
  try {
    
    const { uid, firstName, lastName, email, userType, institution, newsletter } = req.body;
    if (!uid || !email) return res.status(400).json({ error: 'uid and email are required' });

    const userRef = db.collection('users').doc(uid);
    const existing = await userRef.get();
    if (existing.exists) return res.status(409).json({ error: 'User profile already exists' });

    const userData = {
      uid,
      firstName: firstName || '',
      lastName: lastName || '',
      email: email.toLowerCase().trim(),
      userType: userType || 'student',
      institution: institution || '',
      newsletter: !!newsletter,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(userData);
    res.status(201).json({ message: 'User registered successfully', user: userData });
  } catch (err) {
    console.error('registerUser error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User profile not found' });
    res.json({ user: userSnap.data() });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
};

module.exports = { registerUser, getMe };