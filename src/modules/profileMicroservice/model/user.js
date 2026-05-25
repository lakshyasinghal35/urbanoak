class User {
  constructor({ id, email, password, mobile, firstname, lastname, age, sign_up_date } = {}) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.mobile = mobile;
    this.firstname = firstname;
    this.lastname = lastname;
    this.age = age;
    this.sign_up_date = sign_up_date;
  }
}

module.exports = User;
