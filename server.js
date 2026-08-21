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

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "sofa_dana_secret_key_123";

// 🧱 Model User
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" } // user or admin
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// 🔐 Đăng ký
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email đã được sử dụng." });
        }
        
        // Mã hoá mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Tạo user mới
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();
        
        res.status(201).json({ message: "Đăng ký thành công" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// 🔐 Đăng nhập
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Hardcode tài khoản Admin
        if (email === "adminsofa@gmail.com" && password === "admin123") {
            const token = jwt.sign(
                { id: "admin-id", role: "admin", name: "Admin Sofa" },
                JWT_SECRET,
                { expiresIn: "1d" }
            );
            return res.json({
                token,
                user: {
                    id: "admin-id",
                    name: "Admin Sofa",
                    email: "adminsofa@gmail.com",
                    role: "admin"
                }
            });
        }
        
        // Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng." });
        }
        
        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Email hoặc mật khẩu không đúng." });
        }
        
        // Tạo JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: "1d" }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server", error: err.message });
    }
});

// 🚀 chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại port ${PORT}`);
});