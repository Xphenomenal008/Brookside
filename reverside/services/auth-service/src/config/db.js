
const mongoose=require("mongoose")

const connectDb=async()=>{
    try {
        console.log(process.env.MONGO_URI)
        await mongoose.connect(process.env.MONGO_URI)
        console.log("CONNECTED")
        
    } catch (error) {
        console.error(error)
    }

}
module.exports=connectDb