import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  endpoint: {
    type: String,
    required: true,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    }
  }
  // You can add any additional fields here if needed.
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;