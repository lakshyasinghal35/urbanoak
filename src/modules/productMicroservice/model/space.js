// Spaces (
//     id TINYINT AUTO_INCREMENT PRIMARY KEY,
//     `name` VARCHAR(20) UNIQUE
//     cover_image VARCHAR(255)
// )


class Space {
  constructor({ id, name } = {}) {
    this.id = id;
    this.name = name;
    this.cover_image = cover_image;
  }
}

module.exports = Space;