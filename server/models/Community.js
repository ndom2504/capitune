const { v4: uuidv4 } = require('uuid');

// In-memory community storage
let communities = [];

class Community {
  constructor({ name, description, level = 'all', creatorId }) {
    this.id = uuidv4();
    this.name = name;
    this.description = description;
    this.level = level; // all, beginner, intermediate, advanced
    this.creatorId = creatorId;
    this.members = [creatorId];
    this.posts = [];
    this.createdAt = new Date();
  }

  static create(communityData) {
    const community = new Community(communityData);
    communities.push(community);
    return community;
  }

  static findById(id) {
    return communities.find(community => community.id === id);
  }

  static getAll() {
    return communities;
  }

  static addMember(communityId, userId) {
    const community = communities.find(c => c.id === communityId);
    if (community && !community.members.includes(userId)) {
      community.members.push(userId);
      return community;
    }
    return null;
  }

  static removeMember(communityId, userId) {
    const community = communities.find(c => c.id === communityId);
    if (community) {
      community.members = community.members.filter(id => id !== userId);
      return community;
    }
    return null;
  }

  static addPost(communityId, postId) {
    const community = communities.find(c => c.id === communityId);
    if (community) {
      community.posts.push(postId);
      return community;
    }
    return null;
  }
}

module.exports = Community;
