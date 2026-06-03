//write all the queries for the admin microservice

const createAdminQuery = `
  INSERT INTO admin_users (name, email, password, role, is_active, created_by, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?);
`;

function createAdminParams(admin) {
  return [
    admin.name,
    admin.email,
    admin.password,
    admin.role,
    admin.is_active,
    admin.created_by ?? null,
    admin.created_at,
    admin.updated_at,
  ];
}

const updateAdminQuery = `
  UPDATE admin_users
  SET name = ?, password = ?, role = ?, is_active = ?, updated_at = ?
  WHERE id = ?;
`;

function updateAdminParams(admin) {
  return [
    admin.name,
    admin.password,
    admin.role,
    admin.is_active,
    admin.updated_at,
    admin.id,
  ];
}

const getAdminByIdQuery = `
  SELECT * FROM admin_users WHERE id = ?;
`;

const getAdminByEmailQuery = `
  SELECT * FROM admin_users WHERE email = ?;
`;

const getAllAdminsQuery = `
  SELECT * FROM admin_users ORDER BY id ASC;
`;

module.exports = {
  createAdminQuery,
  updateAdminQuery,
  getAdminByIdQuery,
  getAdminByEmailQuery,
  getAllAdminsQuery,
  createAdminParams,
  updateAdminParams,
};
