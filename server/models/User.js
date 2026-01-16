const { v4: uuidv4 } = require('uuid');

// In-memory user storage (for simplicity)
let users = [];

class User {
  constructor({ username, email, password, bio = '', level = 'beginner' }) {
    this.id = uuidv4();
    this.username = username;
    this.email = email;
    this.password = password; // Expected to be hashed
    this.bio = bio;
    this.level = level; // beginner, intermediate, advanced
    this.createdAt = new Date();
    this.followers = [];
    this.following = [];
  }

  static create(userData) {
    const user = new User(userData);
    users.push(user);
    return user;
  }

  static findByEmail(email) {
    return users.find(user => user.email === email);
  }

  static findById(id) {
    return users.find(user => user.id === id);
  }

  static findByUsername(username) {
    return users.find(user => user.username === username);
  }

  static getAll() {
    return users;
  }

  static update(id, updates) {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      return users[userIndex];
    }
    return null;
  }

  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
