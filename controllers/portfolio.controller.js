const portfolioService = require("../services/portfolio.service");
const Portfolio = require("../models/portfolio.model");
const mongoose = require("mongoose");

exports.createPortfolio = async (req, res, next) => {
  try {
    const portfolio = await portfolioService.createPortfolio(
      req.user._id,
      req.body,
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
      req.body,
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
    let { page = 1, limit = 10, skill, profession, location, q } = req.query;

    page = Math.max(parseInt(page), 1);
    limit = Math.min(parseInt(limit), 50);

    const filter = {};

    // 1. FUZZY MATCH LOGIC
    if (q && String(q).trim().length > 0) {
      filter.$text = { $search: String(q).trim().slice(0, 200) };
    } else {
      if (skill && String(skill).trim().length > 0) {
        const s = String(skill)
          .trim()
          .replace(/[,\s]+/g, ".*")
          .slice(0, 100);
        const regex = { $regex: s, $options: "i" };
        filter.$or = [
          { skills: regex },
          { services: regex },
          { profession: regex },
        ];
      }

      if (profession && String(profession).trim().length > 0) {
        const s = String(profession)
          .trim()
          .replace(/[,\s]+/g, ".*")
          .slice(0, 100);
        filter.profession = { $regex: s, $options: "i" };
      }

      if (location && String(location).trim().length > 0) {
        // Fuzzy location match! "Banglore Karnataka" will now safely match "Banglore, Karnataka"
        const s = String(location)
          .trim()
          .replace(/[,\s]+/g, ".*")
          .slice(0, 100);
        filter.location = { $regex: s, $options: "i" };
      }
    }

    const total = await Portfolio.countDocuments(filter);
    const skip = (page - 1) * limit;

    // 2. PREFERENCE SCORING LOGIC
    const isSearchEmpty = !q && !skill && !profession && !location;

    if (isSearchEmpty && req.user) {
      const Preference = require("../models/preference.model");
      const pref = await Preference.findOne({ user: req.user._id });

      if (pref && pref.feedType === "recommended") {
        const prefTags = [...(pref.skills || []), ...(pref.locations || [])]
          .map((t) => t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .filter(Boolean);

        if (prefTags.length > 0) {
          const regexMatches = prefTags.map((tag) => ({
            $regexMatch: { input: "$$sk", regex: tag, options: "i" },
          }));
          const generalRegex = prefTags.join("|");

          const pipeline = [
            { $match: filter },
            {
              $addFields: {
                matchScore: {
                  $add: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ["$skills", []] },
                          as: "sk",
                          cond: { $or: regexMatches },
                        },
                      },
                    },
                    {
                      $cond: [
                        {
                          $regexMatch: {
                            input: { $ifNull: ["$location", ""] },
                            regex: generalRegex,
                            options: "i",
                          },
                        },
                        2,
                        0,
                      ],
                    },
                  ],
                },
              },
            },
            { $sort: { matchScore: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { contact: 0 } }, // exclude contact for privacy exactly like standard get portflios
          ];

          const portfolios = await Portfolio.aggregate(pipeline);

          return res.json({
            data: portfolios,
            pagination: {
              total,
              page,
              pages: Math.ceil(total / limit),
            },
          });
        }
      }
    }

    // 3. STANDARD FALLBACK FETCH LOGIC
    let query = Portfolio.find(
      filter,
      filter.$text ? { score: { $meta: "textScore" } } : {},
    )
      .select("-contact")
      .skip(skip)
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

    const portfolio = await Portfolio.findById(id).lean();

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
