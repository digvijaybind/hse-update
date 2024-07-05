const isPasswordValid = (password) => {
  return (password.length <= 6);
};

module.exports = { isPasswordValid };
