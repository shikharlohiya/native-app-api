

const { Op } = require("sequelize");
const Region = require("../../models/region");

exports.getRegionsByState = async (req, res) => {
  try {
    const { stateName } = req.query;

    if (!stateName) {
      return res.status(400).json({ error: "State name is required" });
    }

    const regions = await Region.findAll({
      where: {
        stateName: {
          [Op.like]: `%${stateName}%`,
        },
      },
    });

    if (regions.length === 0) {
      return res
        .status(404)
        .json({ message: "No regions found for the given state name" });
    }

    res.json(regions);
  } catch (error) {
    console.error("Error fetching regions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
