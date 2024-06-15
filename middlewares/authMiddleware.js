const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const prisma = new PrismaClient();

const InvestorAuthMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('This is decode token', decoded);
        const investor = await prisma.Investor.findUnique({
          where: {
            id: decoded?.id,
          },
        });
        if (!investor) {
          return res.status(401).json({ message: 'Investor not found' });
        }
        req.investor = investor;
        console.log('THis is visitor', investor);
        next();
      }
    } catch (error) {
      return res
        .status(403)
        .json({ message: 'Token expired, please login again' });
    }
  } else {
    return res
      .status(401)
      .json({ message: 'No Bearer token attached to header' });
  }
});

const AdminAuthMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('This is decode token', decoded);
        const admin = await prisma.Admin.findUnique({
          where: {
            id: decoded?.id,
          },
        });
        if (!admin) {
          return res.status(401).json({ message: 'Admin not found' });
        }
        req.admin = admin;
        console.log('THis is admin', admin);
        next();
      }
    } catch (error) {
      return res
        .status(403)
        .json({ message: 'Token expired, please login again' });
    }
  } else {
    return res
      .status(401)
      .json({ message: 'No Bearer token attached to header' });
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.admin;
  const adminUser = await prisma.Admin.findUnique({
    where: {
      email: email,
    },
  });
  if (adminUser.role !== 'ADMIN') {
    throw new Error('Only admin can access this route');
  } else {
    next();
  }
});

module.exports = { InvestorAuthMiddleware, AdminAuthMiddleware, isAdmin };
