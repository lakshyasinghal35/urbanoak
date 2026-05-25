// Categories (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   `name` VARCHAR(30) UNIQUE
// )

class Category {
  constructor({ id, name } = {}) {
    this.id = id;
    this.name = name;
  }
}

module.exports = Category;
