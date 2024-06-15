const mobileRegex = /^[1-9]\d{11,14}$/;
const isValidMobileNumber = async (text) => {
  return mobileRegex.test(text) && text.length >= 12 && text.length <= 15;
};

module.exports = { isValidMobileNumber };
