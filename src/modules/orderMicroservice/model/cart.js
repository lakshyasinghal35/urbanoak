// Carts (
//     id INT AUTO_INCREMENT,
//     user_id INT UNIQUE
// )


// Cart_Items {
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     cart_id INT,
//     user_id INT,
//     product_id INT,
//     quantity INT,
//     UNIQUE (user_id, product_id) 
// }



class Cart {
  constructor({ id, user_id }) {
    this.id = id;
    this.user_id = user_id;
  }
}

class CartItem {
  constructor({ id, cart_id, user_id, product_id, quantity }) {
    this.id = id;
    this.cart_id = cart_id;
    this.user_id = user_id;
    this.product_id = product_id;
    this.quantity = quantity;
  }
}

module.exports = {
  Cart,
  CartItem
};