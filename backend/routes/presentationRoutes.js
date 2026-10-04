const router = require("express").Router();
const auth = require("../middleware/auth");
const db = require("../config/db");

router.use(auth);

router.get("/", async (req, res) => {
  const [rows] = await db.execute(
    "SELECT id,title,created_at,updated_at FROM presentations WHERE user_id=? ORDER BY updated_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

router.post("/", async (req, res) => {
  const title = req.body.title || "Untitled Presentation";
  const data = req.body.data || null;
  const [result] = await db.execute(
    "INSERT INTO presentations (user_id,title,data) VALUES (?,?,?)",
    [req.user.id, title, data ? JSON.stringify(data) : null]
  );
  res.status(201).json({ id: result.insertId, title });
});

router.put("/:id", async (req, res) => {
  const { title, data } = req.body;
  const [result] = await db.execute(
    "UPDATE presentations SET title=?, data=? WHERE id=? AND user_id=?",
    [title || "Untitled Presentation", data ? JSON.stringify(data) : null, req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Presentation not found" });
  res.json({ message: "Saved" });
});

router.delete("/:id", async (req, res) => {
  const [result] = await db.execute(
    "DELETE FROM presentations WHERE id=? AND user_id=?",
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: "Presentation not found" });
  res.json({ message: "Deleted" });
});

module.exports = router;
