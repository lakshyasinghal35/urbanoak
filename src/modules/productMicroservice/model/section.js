// Sections (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     space_id TINYINT NOT NULL,
//     category_id INT NOT NULL,
// )

class Section {
  constructor({ id, space_id, category_id } = {}) {
    this.id = id;
    this.space_id = space_id;
    this.category_id = category_id;
  }
}

module.exports = Section;