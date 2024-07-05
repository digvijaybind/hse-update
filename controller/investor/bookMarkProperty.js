const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();
const prisma = new PrismaClient();

const bookMarkProperty = asyncHandler(async (req, res) => {
  const investorId = req.investor.id;
  const { propertyId } = req.body;

  if (propertyId === null || undefined || investorId === null || undefined) {
    return res.json({
      success: false,
      msg: 'Missing property or investor ID',
    });
  }
  try {
    const bookmark = await prisma.Bookmark.create({
      data: {
        investor: {
          connect: { id: investorId },
        },
        property: {
          connect: { id: propertyId },
        },
      },
    });

    res.json(bookmark);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed' });
  }
});

const getAllMyBookMarked = asyncHandler(async (req, res) => {
  const investorId = req.investor.id;

  try {
    const bookmarks = await prisma.Bookmark.findMany({
      where: {
        investorId,
      },
      include: {
        property: true,
      },
    });

    res.json(bookmarks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'request failed' });
  }
});

module.exports = {
  bookMarkProperty,
  getAllMyBookMarked,
};
