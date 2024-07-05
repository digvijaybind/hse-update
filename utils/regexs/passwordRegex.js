const isPasswordValid = (password) => {
  const regex = /^(?=.*[a-zA-Z])([a-zA-Z0-9]{8,})$/;
  return regex.test(password);
};

module.exports = { isPasswordValid };