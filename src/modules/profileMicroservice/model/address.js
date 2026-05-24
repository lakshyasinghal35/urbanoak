// Addresses (
//     id INT AUTO_INCREMENT,
//     user_id INT,
//     mobile VARCHAR(10),
//     house_no VARCHAR(15),
//     area VARCHAR(15),
//     landmark VARCHAR(20),
//     city VARCHAR(15),
//     `state` VARCHAR(15),
//     country VARCHAR(15),
//     pincode VARCHAR(15),
//     INDEX user_id_index (user_id)
// );


class Address {
  constructor({ id, user_id, mobile, house_no, area, landmark, city, state, country, pincode } = {}) {
    this.id = id;
    this.user_id = user_id;
    this.mobile = mobile;
    this.house_no = house_no;
    this.area = area;
    this.landmark = landmark;
    this.city = city;
    this.state = state;
    this.country = country;
    this.pincode = pincode;
  }
}

module.exports = Address;