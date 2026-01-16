const { v4: uuidv4 } = require('uuid');

// In-memory post storage
let posts = [];

class Post {
  constructor({ userId, username, content, category = 'general', language = 'english' }) {
    this.id = uuidv4();
    this.userId = userId;
    this.username = username;
    this.content = content;
    this.category = category; // general, grammar, vocabulary, pronunciation, culture
    this.language = language;
    this.likes = [];
    this.comments = [];
    this.createdAt = new Date();
  }

  static create(postData) {
    const post = new Post(postData);
    posts.unshift(post); // Add to beginning for chronological order
    return post;
  }

  static findById(id) {
    return posts.find(post => post.id === id);
  }

  static getAll() {
    return posts;
  }

  static getByUserId(userId) {
    return posts.filter(post => post.userId === userId);
  }

  static getByCategory(category) {
    return posts.filter(post => post.category === category);
  }

  static delete(id) {
    const index = posts.findIndex(post => post.id === id);
    if (index !== -1) {
      posts.splice(index, 1);
      return true;
    }
    return false;
  }

  static addLike(postId, userId) {
    const post = posts.find(p => p.id === postId);
    if (post && !post.likes.includes(userId)) {
      post.likes.push(userId);
      return post;
    }
    return null;
  }

  static removeLike(postId, userId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.likes = post.likes.filter(id => id !== userId);
      return post;
    }
    return null;
  }

  static addComment(postId, comment) {
    const post = posts.find(p => p.id === postId);
    if (post) {
      post.comments.push({
        id: uuidv4(),
        ...comment,
        createdAt: new Date()
      });
      return post;
    }
    return null;
  }
}

module.exports = Post;
