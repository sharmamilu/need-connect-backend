const portfolioService = require("../services/portfolio.service");
const Portfolio = require("../models/portfolio.model");
const mongoose = require("mongoose");

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
    res.status(400).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};



exports.getPortfolios = async (req, res) => {
  try {
    const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let { page = 1, limit = 10, skill, profession, location, q } = req.query;

    page = Math.max(parseInt(page), 1);
    limit = Math.min(parseInt(limit), 50); // cap limit to prevent abuse

    const filter = {};

    // Unified full-text search (uses text index defined on model)
    if (q && String(q).trim().length > 0) {
      const search = String(q).trim().slice(0, 200); // cap length
      filter.$text = { $search: search };
    } else {
      // If `skill` is provided, match against skills, services and profession safely
      if (skill && String(skill).trim().length > 0) {
        const s = escapeRegex(String(skill).trim().slice(0, 100));
        const regex = { $regex: s, $options: "i" };
        filter.$or = [{ skills: regex }, { services: regex }, { profession: regex }];
      }

      if (profession && String(profession).trim().length > 0) {
        filter.profession = { $regex: escapeRegex(String(profession).trim().slice(0, 100)), $options: "i" };
      }

      if (location && String(location).trim().length > 0) {
        filter.location = { $regex: escapeRegex(String(location).trim().slice(0, 100)), $options: "i" };
      }
    }

    // Count documents matching filter
    const total = await Portfolio.countDocuments(filter);

    // Build query with projection and sorting. Hide contact in list view for privacy.
    let query = Portfolio.find(filter, filter.$text ? { score: { $meta: "textScore" } } : {})
      .select("-contact")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    if (filter.$text) {
      query = query.sort({ score: { $meta: "textScore" } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const portfolios = await query.exec();

    res.json({
      data: portfolios,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getSuggestions = async (req, res) => {
  try {
    const { type, query = "" } = req.query;

    if (!["skill", "location"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    // limit with sensible defaults and caps
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    if (type === "skill") {
      // include skills, services and profession in suggestions
      const items = await Portfolio.aggregate([
        {
          $project: {
            items: {
              $concatArrays: [
                { $ifNull: ["$skills", []] },
                { $ifNull: ["$services", []] },
                [{ $ifNull: ["$profession", ""] }],
              ],
            },
          },
        },
        { $unwind: "$items" },
        { $match: { items: { $regex: query, $options: "i" } } },
        { $group: { _id: "$items" } },
        { $limit: limit },
      ]);

      return res.json({
        suggestions: items.map((s) => s._id).filter(Boolean),
      });
    }

    if (type === "location") {
      const locations = await Portfolio.aggregate([
        {
          $match: {
            location: { $regex: query, $options: "i" },
          },
        },
        { $group: { _id: "$location" } },
        { $limit: limit },
      ]);

      return res.json({
        suggestions: locations.map((l) => l._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid portfolio ID" });
    }

    const portfolio = await Portfolio.findById(id)
      .lean();

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
