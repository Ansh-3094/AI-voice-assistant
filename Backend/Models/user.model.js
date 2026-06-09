import mongoose from 'mongoose';
const pageSchema = new mongoose.Schema({
    name:{
        type: String,   
    },
    path:{
        type: String
    },
    keywords:{
        type: [String],
        default:[]

    }
},{_id: false})
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    assistantname:{
        type: String,
        default: "VoiceAI"
    },
    businessname:{
        type: String,
        default: "VoiceAI Inc."
    },
    businesstype:{
        type: String,
        default: "Technology"
    },
    businessdescription:{
        type: String,
        default: ""
    },
    tone:{
        type: String,
        enum: ["Formal", "Informal", "Friendly", "Professional"],
        default: "Friendly"
    },
    theme:{
        type: String,
        enum: ["Light", "Dark", "Neon","glassmorphism","cyberpunk"],
        default: "Dark"
    },
    enablevoice:{
        type: Boolean,
        default: true
    },
    page:{
        type:[pageSchema],
        default:[]
    },
    enablenavigation:{
        type: Boolean,
        default: true
    },
    geminiapikey:{
        type: String,
        default: ""
    },
    geministatus:{
        type: String,
        enum: ["active", "inactive","quota_exceeded"],
        default: "active"
    },
    totalmessages:{
        type:Number,
        default:0
    },
    plan:{
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free"
    },
    requestlimit:{
        type: Number,
        default: 200
    },
    proexpireat:{
        type: Date,
        default: null
    },
    issetupcomplete:{
        type:Boolean,
        default:false
    }
},{timestamps: true})

const User = mongoose.model('User',userSchema)
export default User