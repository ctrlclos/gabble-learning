import mongoose from 'mongoose'
import bcrypt from 'bcryptjs';

const learnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minLength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(v);
      },
      message: props => `${props.value} is not a valid email`,
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false // excluded from queries by default
  },
  role: {
    type: String,
    enum: ['learner', 'admin'],
    default: 'learner'
  },
  targetLanguage: {
    type: String,
    required: [true, 'Target language is required']
  },
  nativeLanguage: {
    type: String,
    required: [true, 'Native language is required']
  },
  interests: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
learnerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Compare password for login
learnerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}

const Learner = mongoose.model('Learner', learnerSchema);

export default Learner;
