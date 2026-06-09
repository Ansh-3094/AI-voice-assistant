import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    plan: { type: String },
    orderid: { type: String },
    paymentid: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Billing = mongoose.model("Billing", billingSchema);

export default Billing;
