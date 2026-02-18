const portfolioService = require("../services/portfolio.service");

exports.createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(
      req.user._id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Portfolio created successfully",
      data: portfolio,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.getMyPortfolio(req.user._id);

    res.status(200).json({
      success: true,
      data: portfolio,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.updatePortfolio(
      req.user._id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Portfolio updated successfully",
      data: portfolio,
    });
  } catch (err) {
    next(err);
  }
};
