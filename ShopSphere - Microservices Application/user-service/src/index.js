const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const profileSchema = new mongoose.Schema({
  authId: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  bio: { type: String, default: '', maxlength: 500 },
  phone: { type: String, default: '', maxlength: 30 },
  address: { type: String, default: '', maxlength: 300 }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

app.get('/users/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { authId: req.user.id },
      {
        $setOnInsert: {
          authId: req.user.id,
          name: req.user.name || '',
          email: req.user.email,
          role: req.user.role || 'user'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/users/me', auth, async (req, res) => {
  try {
    const { name, bio, phone, address } = req.body;
    const profile = await Profile.findOneAndUpdate(
      { authId: req.user.id },
      { $set: { name, bio, phone, address } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/users', auth, auth.requireAdmin, async (req, res) => {
  try {
    const users = await Profile.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/users/:id', auth, auth.requireAdmin, async (req, res) => {
  try {
    await Profile.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('User Service connected to MongoDB');
    app.listen(PORT, () => console.log(`User Service running on ${PORT}`));
  })
  .catch(err => {
    console.error('Mongo error', err);
    process.exit(1);
  });
