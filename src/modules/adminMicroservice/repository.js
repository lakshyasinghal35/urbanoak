const { pool } = require('../../config/db');
const Admin = require('./model/admin');
const queries = require('./query');

async function createAdmin(admin) {
  const [result] = await pool.execute(queries.createAdminQuery, queries.createAdminParams(admin));
  return new Admin({
    id: result.insertId,
    ...admin,
  });
}

async function updateAdmin(admin) {
  await pool.execute(queries.updateAdminQuery, queries.updateAdminParams(admin));
  return getAdminById(admin.id);
}

async function getAdminById(id) {
  const [rows] = await pool.execute(queries.getAdminByIdQuery, [id]);
  if (!rows || rows.length === 0) {
    return null;
  }
  return new Admin(rows[0]);
}

async function getAdminByEmail(email) {
  const [rows] = await pool.execute(queries.getAdminByEmailQuery, [email]);
  if (!rows || rows.length === 0) {
    return null;
  }
  return new Admin(rows[0]);
}

async function getAllAdmins() {
  const [rows] = await pool.execute(queries.getAllAdminsQuery);
  return rows.map(row => new Admin(row));
}

module.exports = {
  createAdmin,
  updateAdmin,
  getAdminById,
  getAdminByEmail,
  getAllAdmins,
};
