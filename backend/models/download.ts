import mongoose, { Document, Model } from "mongoose";

export interface IDownload extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  courseVersion: number;
  downloadedAt: Date;
}

const downloadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    courseVersion: { type: Number, default: 1 },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

downloadSchema.index({ userId: 1, courseId: 1 });
downloadSchema.index({ courseId: 1 });

const Download: Model<IDownload> = mongoose.model<IDownload>("Download", downloadSchema);
export default Download;
