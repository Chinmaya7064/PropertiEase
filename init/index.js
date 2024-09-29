const mongoose = require("mongoose")
const initData = require("./data.js")
const Listing = require("../models/listing.js")


const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "66dd716584550a274e4bfcb7"}));
    await Listing.insertMany(initData.data);
    console.log("data was initialized")
}

initDB();