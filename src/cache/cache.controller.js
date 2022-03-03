const client = require('./client');

exports.get = async function (key) {
  try {
    client.connect();
    const response = client.get(key);
    client.disconnect();
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.save = async function (key, time, value) {
  try {
    client.connect();
    const response = client.setEx(key, time, value);
    client.disconnect();
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.expire = async function (key, time) {
  try {
    client.connect();
    const response = client.expireAt(key, time);
    client.disconnect();
    return response;
  } catch (error) {
    throw new Error(error.message);
  }
};
