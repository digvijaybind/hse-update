const axios = require('axios');
require('dotenv').config();
const { SendBaseChampUrl } = require('../../utils/constant/sendChamp_url');

class SendchampService {
  static async sendSMS({ to, message }) {
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.SENDCHAMP_KEY}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
    };

    const data = {
      to,
      message,
      sender_name: 'sendChampHseServiceProvider',
      route: 'dnd',
    };

    try {
      const response = await axios.post(sendSmsUrl, data, config);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  static async sendEmailOTP(info) {
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.SENDCHAMP_KEY}`,
        accept: 'application/json,text/plain,*/*',
        'content-type': 'application/json',
      },
    };

    const data = {
      meta_data: info.meta_data,
      channel: info.channel,
      sender: info.sender,
      token_type: info.token_type,
      token_length: info.token_length,
      expiration_time: info.expiration_time,
      customer_email_address: info.customer_email_address,
    };

    try {
      const response = await axios.post(
        SendBaseChampUrl.sendOtpUrl,
        data,
        config
      );
      return { data: response.data, info };
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  static async sendMobileNumberOTP(info) {
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.SENDCHAMP_KEY}`,
        accept: 'application/json,text/plain,*/*',
        'content-type': 'application/json',
      },
    };

    const data = {
      meta_data: info.meta_data,
      channel: info.channel,
      sender: info.sender,
      token_type: info.token_type,
      token_length: info.token_length,
      expiration_time: info.expiration_time,
      customer_mobile_number: info.customer_mobile_number,
    };

    try {
      const response = await axios.post(
        SendBaseChampUrl.sendOtpUrl,
        data,
        config
      );
      return { data: response.data, info };
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  static async confirmOTP(info) {
    const config = {
      headers: {
        Authorization: `Bearer ${process.env.SENDCHAMP_KEY}`,
        accept: 'application/json,text/plain,*/*',
        'content-type': 'application/json',
      },
    };

    const data = {
      verification_reference: info.verification_reference,
      verification_code: info.verification_code,
    };

    try {
      const response = await axios.post(
        SendBaseChampUrl.confirmOtpUrl,
        data,
        config
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}

module.exports = SendchampService;
