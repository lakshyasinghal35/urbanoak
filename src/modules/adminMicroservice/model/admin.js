class Admin {
  constructor({ id, name, email, password, role, is_active, created_by, created_at, updated_at } = {}) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.role = role;
    this.is_active = is_active;
    this.created_by = created_by;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = Admin;
