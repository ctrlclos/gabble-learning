import mongoose from 'mongoose'
import bcrypt from 'bcryptjs';

const learnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true, // removes white space from beginning and end
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
        // Basic email format validation using regex
        /**
         * Checks password strength:
          (?=.*[a-z]) - Must contain at least one lowercase letter
          (?=.*[A-Z]) - Must contain at least one uppercase letter
          (?=.*\d) - Must contain at least one digit
         */
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
    // when we do -> Learner.find() -> password field wont be included.
    select: false // ensures field wont be returned on queries by default
  },
  role: {
    type: String,
    enum: ['learner', 'admin'], // can only be one of these two values
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// runs before saving user to the database (before_save)
learnerSchema.pre('save', async function() {
  if(!this.isModified('password')){
    return; // skip hashing if password unchanged
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

  // 'this' -> document being saved
  this.password = await bcrypt.hash(this.password, saltRounds);
});

learnerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}

const Learner = mongoose.model('Learner', learnerSchema);

export default Learner;
