const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const rewardEventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["ANNUAL", "SPECIAL", "SPECIAL_OCCASION", "SCHOOL_YEAR"], // Giữ lại cũ để tương thích
      required: true,
      index: true,
    },
    description: { type: String },
    date: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    maxSlots: { type: Number, default: 0 }, // Số slot tối đa
    budget: { type: Number },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "EXPIRED", "ENDED", "PLANNED", "ONGOING", "COMPLETED"], // Giữ lại cũ để tương thích
      default: "OPEN",
      index: true,
    },
  },
  { timestamps: true }
);

rewardEventSchema.index({ type: 1, status: 1, date: 1 });

module.exports = model("RewardEvent", rewardEventSchema);
