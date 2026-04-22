import mongoose, { Schema, Document, Model } from "mongoose";

// ── Embedded sub-documents ────────────────────────────────────────────────────

export interface ICitation {
  chunkId: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  text: string;
}

export interface IReActStep {
  thought: string;
  action: string;
  input: string;
  observation: string;
}

export interface IMessage {
  _id: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  citations: ICitation[];
  trace: IReActStep[];
  createdAt: Date;
}

export interface ISessionDocument {
  documentId: string;
  filename: string;
  mimeType: string;
  uploadedAt: Date;
  chunkCount: number;
  collection: string;
  sizeBytes: number;
}

// ── Main session document ─────────────────────────────────────────────────────

export interface IChatSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  /** Documents uploaded / associated with this session */
  documents: ISessionDocument[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const CitationSchema = new Schema<ICitation>(
  {
    chunkId: String,
    documentId: String,
    filename: String,
    chunkIndex: Number,
    text: String,
  },
  { _id: false }
);

const ReActStepSchema = new Schema<IReActStep>(
  {
    thought: String,
    action: String,
    input: String,
    observation: String,
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    citations: { type: [CitationSchema], default: [] },
    trace: { type: [ReActStepSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SessionDocumentSchema = new Schema<ISessionDocument>(
  {
    documentId: { type: String, required: true },
    filename: { type: String, required: true },
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now },
    chunkCount: { type: Number, default: 0 },
    collection: String,
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat" },
    messages: { type: [MessageSchema], default: [] },
    documents: { type: [SessionDocumentSchema], default: [] },
  },
  { timestamps: true }
);

const ChatSession: Model<IChatSession> =
  mongoose.models.ChatSession ??
  mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSession;
