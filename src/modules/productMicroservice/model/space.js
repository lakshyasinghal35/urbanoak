// Spaces (
//     id TINYINT AUTO_INCREMENT PRIMARY KEY,
//     `name` VARCHAR(20) UNIQUE
//     cover_image VARCHAR(255)
// )


class Space {
  constructor({ id, name, cover_image, coverImage } = {}) {
    this.id = id;
    this.name = name;
    this.coverImage = (coverImage == undefined && cover_image == undefined) ? null : (coverImage ?? cover_image);
  }
}

module.exports = Space;