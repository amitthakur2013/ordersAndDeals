const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  redeemCode: String,
  deal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deal",
  },
  outlet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Merchant",
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  status: {
    type: String,
    enum: ["active", "redeemed"],
  },
  purchasedOn: Date,
  redeemedOn: Date,
  price: Number,
  discountedPrice: Number,
  promocode: String,
});

const Order = mongoose.model("Order", orderSchema);

exports.Order = Order;
