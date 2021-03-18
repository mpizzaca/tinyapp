const { assert } = require('chai');
const { getUserByEmail } = require('../helpers');

const testUsers = {
  "randomId1": {
    id: "randomId1",
    email: "user1@email.com",
    password: "password1",
  },
  "randomId2": {
    id: "randomId2",
    email: "user2@email.com",
    password: "password2",
  },
};

describe('#getUserByEmail', () => {
  it('should return a user with a valid email', () => {
    const user = getUserByEmail('user1@email.com', testUsers);
    const expected = {
      id: "randomId1",
      email: "user1@email.com",
      password: "password1",
    };
    assert.deepEqual(user, expected);
  });
  it('should return undefined with an invalid email', () => {
    const user = getUserByEmail('user3@email.com', testUsers);
    assert.isUndefined(user);
  });
});