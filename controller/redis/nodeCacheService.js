const node_cache = require('node-cache');

// Creating and configuring a cache client
const cacheClient = new node_cache({ stdTTL: 300 });

class OTPService {
  static async storeMobileNumberOTP(reference) {
    try {
      const response = cacheClient.set('mobileNumber', reference, 300);
      console.log('reponse is 10', response);
      return response;
    } catch (err) {
      throw new Error(`Error storing mobile number OTP: ${err}`);
    }
  }

  static async getMobileNumberOTPReference() {
    try {
      const reference = cacheClient.get('mobileNumber');
      return reference;
    } catch (err) {
      throw new Error(`Error getting mobile number OTP reference: ${err}`);
    }
  }

  static async storeEmailIdOTP(reference) {
    try {
      const response = cacheClient.set('emailId', reference, 300);
      console.log('reponse is 29', response);
      return response;
    } catch (err) {
      throw new Error(`Error storing email ID OTP: ${err}`);
    }
  }

  static async getOTPEmailIdReference() {
    try {
      const reference = cacheClient.get('emailId');
      return reference;
    } catch (err) {
      throw new Error(`Error getting email ID OTP reference: ${err}`);
    }
  }
}

module.exports = { OTPService };
