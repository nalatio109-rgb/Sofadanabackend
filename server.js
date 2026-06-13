const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 🔗 Kết nối MongoDB
mongoose.connect("mongodb+srv://nna710976_db_user:pRF8YqV0N832QkvU@na10.mzejase.mongodb.net/shop")
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log(err));

// 🧱 Model Product
const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    category: String,
    description: String,
    otherImages: String,
    features: String,
    size: String,
    sizeImages: String,
    stock: { type: Number, default: 0 }
});

const Product = mongoose.model("Product", productSchema);

// 🏠 test server
app.get("/", (req, res) => {
    res.send("Server đang chạy 🚀");
});

// 🧱 Model Order
const orderSchema = new mongoose.Schema({
    customer: {
        name: String,
        phone: String,
        address: String,
        note: String
    },
    items: [
        {
            name: String,
            price: Number,
            quantity: Number,
            image: String
        }
    ],
    totalAmount: Number,
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "Mới" }
});

const Order = mongoose.model("Order", orderSchema);

// 📄 GET all products
app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ➕ ADD product
app.post("/products", async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.json(newProduct);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ❌ DELETE product
app.delete("/products/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xoá sản phẩm" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// ✏️ UPDATE product
app.put("/products/:id", async (req, res) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 📄 GET all orders
app.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ➕ ADD order
app.post("/orders", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();

        // 👉 Trừ tồn kho sản phẩm
        const items = req.body.items;
        for (let item of items) {
            if (item.productId) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity }
                });
            }
        }

        res.json(newOrder);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ✏️ UPDATE order status
app.put("/orders/:id", async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ❌ DELETE order
app.delete("/orders/:id", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xoá đơn hàng" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// 🚀 chạy server
app.listen(3000, () => {
    console.log("🚀 Server chạy tại http://localhost:3000");
});