require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// DB config
mongoose
  .connect("mongodb://localhost:27017/reminderAppDB")
  .then(() => console.log("DB Connected!"))
  .catch((err) => console.log(err));

// Schema and Model
const reminderSchema = new mongoose.Schema({
  reminderMsg: String,
  remindAt: String,
  isReminded: Boolean,
});

const Reminder = mongoose.model("Reminder", reminderSchema);

//whats up reminder

const checkReminders = async () => {
  try {
    const reminderList = await Reminder.find({});
    reminderList.forEach(async (reminder) => {
      if (!reminder.isReminded) {
        const now = new Date();
        if (new Date(reminder.remindAt) - now < 0) {
          await Reminder.findByIdAndUpdate(reminder._id, { isReminded: true });
          // send Message
          const accountSid = process.env.ACCOUNT_SID;
          const authToken = process.env.AUTH_TOKEN;
          const client = require("twilio")(accountSid, authToken);

          client.messages
            .create({
              body: reminder.reminderMsg,
              from: "whatsapp:+14155238886",
              to: "whatsapp:+919749865804",
            })
            .then((message) => console.log(message.sid))
            .catch((error) => console.log(error));
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
};

setInterval(checkReminders, 60000);


  

// Routes
app.get("/getAllreminder", async (req, res) => {
  try {
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.log("Error fetching reminders:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/addReminder", async (req, res) => {
  const { reminderMsg, remindAt } = req.body;
  try {
    const reminder = new Reminder({
      reminderMsg,
      remindAt,
      isReminded: false,
    });
    await reminder.save();
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.log("Error saving reminder:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/deleteReminder", async (req, res) => {
  try {
    await Reminder.deleteOne({ _id: req.body.id });
    const reminderList = await Reminder.find({});
    res.send(reminderList);
  } catch (err) {
    console.log("Error deleting reminder:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send("A message from Backend");
});

app.listen(9000, () => console.log("Backend is running"));
