const express = require("express");

// * NPM Packages
const shortid = require("shortid");
const randomize = require("randomatic");
const _ = require("lodash");

// * Models
const { Order } = require("../models/orders");
const { Customer } = require("../models/customer");

// * Functions

// * Util

// * Middleware

// * Requests -->
const router = express.Router();

// * Get all orders
router.get("/all", async (req, res) => {
  try {
    var orders = await Order.find({}).populate("customer").sort("-purchasedOn");
    if (!orders) return res.send("Orders not found.");

    res.send(orders);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get a single order ( AnC )
router.get("/view/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("deal")
      .populate("customer")
      .populate("outlet")
      .exec();
    if (!order) return res.send("Order not found.");

    res.send(order);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get a single order (M)
router.get("/merchant/view/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("deal")
      .populate("customer")
      .populate("outlet")
      .exec();
    if (!order) return res.send("Order not found.");

    var orderLocal = _.omit(req.body, ["redeemCode"]);
    var redeemCodeLocal = order.redeemCode.slice(0, -6).trim();
    redeemCodeLocal = redeemCodeLocal + "******";

    var response = {
      ...orderLocal,
      redeemCode: redeemCodeLocal,
    };

    res.send(response);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get orders in date range
router.post("/between-dates", async (req, res) => {
  try {
    const ordersFrom = new Date(req.body.ordersFrom.toString());
    const ordersTill = new Date(req.body.ordersTill.toString());

    const orders = await Order.find({
      purchasedOn: { $gte: ordersFrom },
      purchasedOn: { $lte: ordersTill },
    })
      .populate("customer")
      .sort("-purchasedOn");

    if (!orders) return res.send("Orders not found.");

    res.send(orders);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get orders of a merchant
router.get("/merchant/:merchant_id", async (req, res) => {
  try {
    const orders = await Order.find({
      outlet: req.params.merchant_id,
    })
      .populate("customer")
      .sort("-purchasedOn");

    if (!orders) return res.send("No Orders found.");

    res.send(orders);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get orders of a merchant in date range
router.post("/merchant/between-dates", async (req, res) => {
  try {
    const ordersFrom = new Date(req.body.ordersFrom.toString());
    const ordersTill = new Date(req.body.ordersTill.toString());

    const orders = await Order.find({
      outlet: req.params.merchant_id,
      purchasedOn: { $gte: ordersFrom, $lte: ordersTill },
    })
      .populate("customer")
      .sort("-purchasedOn");

    if (!orders) return res.send("No Orders found.");

    res.send(orders);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Get orders of a customer
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user_id })
      .populate("deal, outlet")
      .sort("-purchasedOn");

    if (!orders) return res.send("Orders not found.");

    res.send(orders);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Create a new order
router.post("/new", async (req, res) => {
  try {
    var redeemCode =
      shortid.generate().toString() +
      "-" +
      shortid.generate().toString() +
      "-" +
      randomize("Aa0", 6).toString();

    var newOrder = await Order.create({
      redeemCode: redeemCode,
      deal: req.body.deal,
      outlet: req.body.outlet,
      // customer: req.user._id,
      customer: req.body.userid,
      status: "active",
      purchasedOn: new Date(),
      price: req.body.price,
      promocode: req.body.promocodeApplied, // <-- This is an optional field
      discountedPrice: req.body.discountedPrice,
    });

    // var customer = await Customer.findById(req.user._id).exec();
    var customer = await Customer.findById(req.body.userid).exec();
    customer.orders.push(newOrder._id);
    customer.markModified("orders");
    await customer.save();

    res.send(newOrder);
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Redeem Order
router.post("/redeem/:order_id", async (req, res) => {
  try {
    var order = await Order.findById(req.params.order_id).exec();

    if (!order) return res.send("Order does not exist.");

    // check if already redeemed
    if (order.status.trim() === "redeemed")
      return res.send("Already redeemed.");

    // checking the redeem code
    if (req.body.code.trim() !== order.redeemCode.trim())
      return res.send("Invalid redeem code.");

    // check if order is in valid date bounds
    if (
      new Date() >= order.deal.validFrom &&
      new Date() <= order.deal.validTill
    ) {
      // code is valid
      order.status = "redeemed";
      order.redeemedOn = new Date();

      order = await order.save();

      res.send(order);
    } else {
      // order expired
      return res.send("Redeem code has expired.");
    }
  } catch (error) {
    console.log(error);
    res.send("Something went wrong.");
  }
});

// * Requests End -->

module.exports = router;
