const { PrismaClient, Role } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const SaveInvestorTokenForPushNotification = asyncHandler(async (req, res) => {
  const investorId = req.investor._id;
  const { expoPushToken } = req.body;
  if (expoPushToken === null || undefined) {
    return res.json({
      success: false,
      msg: 'token fields are required',
    });
  }
  try {
    const investor = await prisma.Investor.update({
      where: { id: investorId },
      data: {
        expoPushToken: expoPushToken,
      },
    });
    res.status(200).send('Token saved');
  } catch (error) {
    console.error('Error saving token:', error);
    return res.status(500).json({ error: 'Server error', error });
  }
});

module.exports = { SaveInvestorTokenForPushNotification };
