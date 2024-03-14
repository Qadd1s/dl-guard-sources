// Import "express" and create a server
const express = require("express");
const app = express();
const port = 3003;

// Adding the ability to make POST-requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Import "mongoose" and connect to the database
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/dl-guard");

// Create a schemes
const studentsSchema = new mongoose.Schema({
	firstname: {
		required: true,
		type: String,
	},
	surname: {
		required: true,
		type: String,
	},
	uid: {
		unique: true,
		required: true,
		type: String,
	},
	login: {
		unique: true,
		required: true,
		type: String,
	},
	password: {
		required: true,
		type: String,
	},
	isStudying: {
		required: true,
		type: Boolean,
	},
	arrivalTime: Date,
});

const glitchesSchema = new mongoose.Schema(
	{
		errType: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const statsSchema = new mongoose.Schema({});

// Connecting schemes with collections
const Student = mongoose.model("students", studentsSchema);
const Glitch = mongoose.model("glitches", glitchesSchema);

// Starting the server
app.listen(port, function () {
	console.log(`Сервер запущен по адресу: http://localhost:${port}/`);
});

// Routes
app.post("/check-uid", async function (req, res) {
	const uid = req.body.uid;

	try {
		const student = await Student.findOne({ uid: uid });

		if (student) {
			if (student.isStudying) {
				res.send("true");

				try {
					student.arrivalTime = new Date();
					await student.save();
				} catch (error) {
					detectGlitch("server");
					console.error("No arrival time noted");
				}
			} else {
				res.send("false");
			}
		} else {
			res.send("false");
		}
	} catch (error) {
		res.send("error");
		console.error(error);
	}
});

app.get("/glitch-detected", function (req) {
	detectGlitch(req.body.type);
});

async function detectGlitch(type) {
	const newGlitch = new Glitch({
		errType: type,
	});

	try {
		await newGlitch.save();
	} catch (error) {
		console.error(error);
	}
}
