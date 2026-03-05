import express from "express";
import { createServer as createViteServer } from "vite";
import mongoose from "mongoose";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const useMongoDB = !!MONGODB_URI;
let db: any = null;

// MongoDB Models (only used if useMongoDB is true)
const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  image_url: String,
  status: { type: String, default: 'active' },
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  image_url: String,
  sort_order: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: String
});

const Game = mongoose.model("Game", gameSchema);
const Product = mongoose.model("Product", productSchema);
const Setting = mongoose.model("Setting", settingSchema);

// SQLite Setup (Fallback for preview)
if (!useMongoDB) {
  console.log("MONGODB_URI not found. Falling back to SQLite for preview.");
  db = new Database("games.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      image_url TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS other_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initial Setup
async function initializeData() {
  try {
    if (useMongoDB) {
      const logo = await Setting.findOne({ key: 'logo_url' });
      if (!logo) await Setting.create({ key: 'logo_url', value: 'https://picsum.photos/seed/logo/100/100' });

      const adminPass = await Setting.findOne({ key: 'admin_password' });
      if (!adminPass) {
        await Setting.create({ key: 'admin_password', value: 'AK@9830494282' });
      } else {
        await Setting.updateOne({ key: 'admin_password' }, { value: 'AK@9830494282' });
      }

      const gameCount = await Game.countDocuments();
      if (gameCount === 0) {
        const initialGames = [
          { title: "Hacker Game", description: "A demo game showcasing basic game mechanics. This prototype demonstrates interactive elements and serves as a foundation for future development.", url: "https://akashsamanta7.github.io/HackerGame/", image_url: "https://picsum.photos/seed/hacker/800/600", status: "active", sort_order: 1 },
          { title: "Chess Vault", description: "A puzzle game where players follow clues to position chess pieces correctly. Solve the chessboard puzzle to unlock the vault!", url: "https://akashsamanta7.github.io/Chess-Vault-1/", image_url: "https://picsum.photos/seed/chess/800/600", status: "active", sort_order: 2 },
          { title: "The Bhool Bhulaiyaa", description: "You are trapped in a shifting maze. Each level has four doors — Red, Blue, Green, Yellow — and four guides — A, B, C, and D. Each gives you a hint, but not all can be trusted.", url: "https://akashsamanta7.github.io/Bhool-Bhulaiyaa/", image_url: "https://picsum.photos/seed/maze/800/600", status: "active", sort_order: 3 },
          { title: "Lucky Coin Game", description: "Try your luck with our new virtual coin flip game! Select your bid, enter your special TID, and see if fortune favors you.", url: "https://akashsamanta7.github.io/Bid/", image_url: "https://picsum.photos/seed/coin/800/600", status: "active", sort_order: 4 },
          { title: "MindTrace", description: "An AI-powered investigative web game where players step into the role of a detective solving dynamically generated murder cases.", url: "https://ai-detective-surv.onrender.com", image_url: "https://picsum.photos/seed/detective/800/600", status: "active", sort_order: 5 },
          { title: "The Evaluator", description: "Step into the role of an evaluator, analyze unique candidates, and make tough calls—accept, reject, or stay doubtful.", url: "https://akashsamanta7.github.io/Website/", image_url: "https://picsum.photos/seed/evaluator/800/600", status: "coming_soon", sort_order: 6 }
        ];
        await Game.insertMany(initialGames);
      }
    } else {
      // SQLite Initialization
      const logo = db.prepare("SELECT value FROM settings WHERE key = 'logo_url'").get();
      if (!logo) db.prepare("INSERT INTO settings (key, value) VALUES ('logo_url', 'https://picsum.photos/seed/logo/100/100')").run();

      const adminPass = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();
      if (!adminPass) {
        db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password', 'AK@9830494282')").run();
      } else {
        db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password'").run('AK@9830494282');
      }

      const rowCount = db.prepare("SELECT COUNT(*) as count FROM games").get() as { count: number };
      if (rowCount.count === 0) {
        const insert = db.prepare("INSERT INTO games (title, description, url, image_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
        const games = [
          ["Hacker Game", "A demo game showcasing basic game mechanics. This prototype demonstrates interactive elements and serves as a foundation for future development.", "https://akashsamanta7.github.io/HackerGame/", "https://picsum.photos/seed/hacker/800/600", "active", 1],
          ["Chess Vault", "A puzzle game where players follow clues to position chess pieces correctly. Solve the chessboard puzzle to unlock the vault!", "https://akashsamanta7.github.io/Chess-Vault-1/", "https://picsum.photos/seed/chess/800/600", "active", 2],
          ["The Bhool Bhulaiyaa", "You are trapped in a shifting maze. Each level has four doors — Red, Blue, Green, Yellow — and four guides — A, B, C, and D. Each gives you a hint, but not all can be trusted.", "https://akashsamanta7.github.io/Bhool-Bhulaiyaa/", "https://picsum.photos/seed/maze/800/600", "active", 3],
          ["Lucky Coin Game", "Try your luck with our new virtual coin flip game! Select your bid, enter your special TID, and see if fortune favors you.", "https://akashsamanta7.github.io/Bid/", "https://picsum.photos/seed/coin/800/600", "active", 4],
          ["MindTrace", "An AI-powered investigative web game where players step into the role of a detective solving dynamically generated murder cases.", "https://ai-detective-surv.onrender.com", "https://picsum.photos/seed/detective/800/600", "active", 5],
          ["The Evaluator", "Step into the role of an evaluator, analyze unique candidates, and make tough calls—accept, reject, or stay doubtful.", "https://akashsamanta7.github.io/Website/", "https://picsum.photos/seed/evaluator/800/600", "coming_soon", 6]
        ];
        for (const game of games) insert.run(...game);
      }
    }
  } catch (err) {
    console.error("Initialization error:", err);
  }
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // Connect to DB and Initialize
  if (useMongoDB) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB");
      await initializeData();
    } catch (err) {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    }
  } else {
    await initializeData();
  }

  // Admin Auth
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      let storedValue = "";
      if (useMongoDB) {
        const stored = await Setting.findOne({ key: 'admin_password' });
        storedValue = stored?.value || "";
      } else {
        const stored = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get() as { value: string };
        storedValue = stored?.value || "";
      }
      
      if (password === storedValue) {
        res.json({ success: true, token: "mock-token-for-prototype" });
      } else {
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // File Upload
  app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      res.json({ url: `/uploads/${req.file.filename}` });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Games API
  app.get("/api/games", async (req, res) => {
    try {
      if (useMongoDB) {
        const games = await Game.find().sort({ sort_order: 1, created_at: -1 });
        res.json(games.map(g => ({ ...g.toObject(), id: g._id })));
      } else {
        const games = db.prepare("SELECT * FROM games ORDER BY sort_order ASC, created_at DESC").all();
        res.json(games);
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const { title, description, url, image_url, status } = req.body;
      if (useMongoDB) {
        const maxOrderGame = await Game.findOne().sort({ sort_order: -1 });
        const nextOrder = (maxOrderGame?.sort_order || 0) + 1;
        const game = await Game.create({ title, description, url, image_url, status: status || 'active', sort_order: nextOrder });
        res.json({ id: game._id });
      } else {
        const maxOrder = db.prepare("SELECT MAX(sort_order) as maxOrder FROM games").get() as { maxOrder: number | null };
        const nextOrder = (maxOrder?.maxOrder || 0) + 1;
        const info = db.prepare("INSERT INTO games (title, description, url, image_url, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(title, description, url, image_url, status || 'active', nextOrder);
        res.json({ id: info.lastInsertRowid });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, url, image_url, status, sort_order } = req.body;
      if (useMongoDB) {
        if (sort_order !== undefined) await Game.findByIdAndUpdate(id, { sort_order });
        else await Game.findByIdAndUpdate(id, { title, description, url, image_url, status });
      } else {
        if (sort_order !== undefined) db.prepare("UPDATE games SET sort_order = ? WHERE id = ?").run(sort_order, id);
        else db.prepare("UPDATE games SET title = ?, description = ?, url = ?, image_url = ?, status = ? WHERE id = ?").run(title, description, url, image_url, status, id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (useMongoDB) {
        const result = await Game.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ success: false, message: "Game not found" });
      } else {
        const result = db.prepare("DELETE FROM games WHERE id = ?").run(id);
        if (result.changes === 0) return res.status(404).json({ success: false, message: "Game not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Other Products API
  app.get("/api/products", async (req, res) => {
    try {
      if (useMongoDB) {
        const products = await Product.find().sort({ sort_order: 1, created_at: -1 });
        res.json(products.map(p => ({ ...p.toObject(), id: p._id })));
      } else {
        const products = db.prepare("SELECT * FROM other_products ORDER BY sort_order ASC, created_at DESC").all();
        res.json(products);
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { title, description, url, image_url } = req.body;
      if (useMongoDB) {
        const maxOrderProduct = await Product.findOne().sort({ sort_order: -1 });
        const nextOrder = (maxOrderProduct?.sort_order || 0) + 1;
        const product = await Product.create({ title, description, url, image_url, sort_order: nextOrder });
        res.json({ id: product._id });
      } else {
        const maxOrder = db.prepare("SELECT MAX(sort_order) as maxOrder FROM other_products").get() as { maxOrder: number | null };
        const nextOrder = (maxOrder?.maxOrder || 0) + 1;
        const info = db.prepare("INSERT INTO other_products (title, description, url, image_url, sort_order) VALUES (?, ?, ?, ?, ?)").run(title, description, url, image_url, nextOrder);
        res.json({ id: info.lastInsertRowid });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { sort_order } = req.body;
      if (useMongoDB) {
        if (sort_order !== undefined) await Product.findByIdAndUpdate(id, { sort_order });
      } else {
        if (sort_order !== undefined) db.prepare("UPDATE other_products SET sort_order = ? WHERE id = ?").run(sort_order, id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (useMongoDB) await Product.findByIdAndDelete(id);
      else db.prepare("DELETE FROM other_products WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Settings API
  app.get("/api/settings", async (req, res) => {
    try {
      let settingsList = [];
      if (useMongoDB) settingsList = await Setting.find();
      else settingsList = db.prepare("SELECT * FROM settings").all();
      
      const settingsObj = settingsList.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      if (useMongoDB) await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
      else db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post("/api/admin/reset", async (req, res) => {
    try {
      if (useMongoDB) {
        await Game.deleteMany({});
        await Product.deleteMany({});
      } else {
        db.prepare("DELETE FROM games").run();
        db.prepare("DELETE FROM other_products").run();
      }
      await initializeData();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
