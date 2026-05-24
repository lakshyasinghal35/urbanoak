// Products are stored in MongoDB (products collection).
// category_id references the MySQL categories table.


class Product {
  constructor({ id, title, category_id, category, wood_type, dimensions, mrp, discount, images, details, units } = {}) {
    this.id = id;
    this.title = title;
    this.category_id = category_id;
    this.category = category;
    this.wood_type = wood_type;
    this.dimensions = dimensions;
    this.mrp = mrp;
    this.discount = discount;
    this.images = images;
    this.details = details;
    this.units = units;
  }
}

module.exports = Product;
