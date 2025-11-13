const citizenService = require("../services/citizenService");
const { Citizen, Household, User } = require("../models");
const bcrypt = require("bcryptjs");

module.exports = {
  // Get current citizen info
  async getMe(req, res, next) {
    try {
      const citizen = await Citizen.findOne({ user: req.user._id })
        .populate("household")
        .populate("user");

      if (!citizen) {
        return res.status(404).json({ message: "Citizen profile not found" });
      }

      res.json(citizen);
    } catch (err) {
      next(err);
    }
  },

  // Update current citizen info
  async updateMe(req, res, next) {
    try {
      let citizen = await Citizen.findOne({ user: req.user._id });

      const allowedFields = [
        "fullName",
        "avatarUrl",
        "email",
        "phone",
        "dateOfBirth",
        "gender",
        "nationalId",
        "ethnicity",
        "nationality",
        "educationLevel",
        "occupation",
      ];

      const updateData = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      if (!citizen) {
        citizen = await Citizen.create({
          ...updateData,
          user: req.user._id,
        });
      } else {
        citizen = await Citizen.findByIdAndUpdate(citizen._id, updateData, {
          new: true,
          runValidators: true,
        });
      }
      if (updateData.email !== undefined) {
        await User.findByIdAndUpdate(req.user._id, {
          email: updateData.email
        });
      }
    

      citizen = await Citizen.findById(citizen._id)
        .populate("household")
        .populate("user");

      res.json(citizen);
    } catch (err) {
      next(err);
    }
  },

  // Get current citizen's household with all members
  async getMyHousehold(req, res, next) {
    try {
      const citizen = await Citizen.findOne({ user: req.user._id });

      if (!citizen || !citizen.household) {
        return res.status(404).json({
          message: "Household not found",
          error: !citizen
            ? "Citizen profile not found"
            : "Citizen not assigned to any household",
        });
      }

      const household = await Household.findById(citizen.household)
        .populate("head")
        .populate("members");

      if (!household) {
        return res.status(404).json({ message: "Household not found" });
      }

      const response = {
        household: {
          _id: household._id,
          code: household.code,
          headName: household.head?.fullName,
          headId: household.head?._id,
          address: household.address,
          phone: household.phone,
          status: household.status,
          establishedAt: household.establishedAt,
        },
        members: household.members || [],
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  },

  // Create new citizen
  async create(req, res, next) {
    try {
      const doc = await citizenService.create(req.body);
      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },

  // Update citizen by ID
  async update(req, res, next) {
    try {
      const doc = await citizenService.update(req.params.id, req.body);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },

  // Delete citizen
  async delete(req, res, next) {
    try {
      const doc = await citizenService.delete(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Deleted" });
    } catch (err) {
      next(err);
    }
  },

  // Get citizen by ID
  async getById(req, res, next) {
    try {
      const doc = await citizenService.getById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      res.json(doc);
    } catch (err) {
      next(err);
    }
  },

  // Get citizen stats
  async getStats(req, res, next) {
    try {
      const stats = await citizenService.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },

  // Get all citizens
  async getAll(req, res, next) {
    try {
      const citizens = await Citizen.find()
        .populate("household")
        .populate("user");
      res.json(citizens);
    } catch (err) {
      next(err);
    }
  },

  // ✅ Create account linked to citizen
  async createAccount(req, res, next) {
    try {
      const citizenId = req.params.id;
      const { username, password } = req.body;

      const citizen = await Citizen.findById(citizenId);
      if (!citizen) return res.status(404).json({ message: "Citizen not found" });

      const finalUsername = username || citizen.phone;
      const finalPassword = password || citizen.phone;

      if (!finalUsername || !finalPassword) {
        return res.status(400).json({ message: "Cannot create account without phone" });
      }

      const existingUser = await User.findOne({ username: finalUsername });
      if (existingUser) return res.status(409).json({ message: "Username already exists" });

      const passwordHash = await bcrypt.hash(finalPassword, 10);

      const user = await User.create({
        username: finalUsername,
        passwordHash,
        role: "CONG_DAN",
        fullName: citizen.fullName,
        citizen: citizen._id,
        email: citizen.email || undefined,
        phone: citizen.phone || undefined,
      });

      citizen.user = user._id;
      await citizen.save();

      res.status(201).json({
        message: "Account created successfully",
        username: user.username,
        password: finalPassword,
      });
    } catch (err) {
      next(err);
    }
  },
};