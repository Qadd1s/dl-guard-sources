// Import "express" and create a server
const express = require("express");
const app = express();
const port = 3003;

// Adding the ability to make POST-requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static distribution
app.use(express.static("public"));

// Import "handlebars" and set up the template engine
const hbs = require("hbs");
app.set("views", "views");
app.set("view engine", "hbs");

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
});

const statsSchema = new mongoose.Schema({
	date: {
		required: true,
		type: Date,
	},
	systemErrors: [
		{
			errType: String,
		},
	],
	visitors: [
		{
			student: mongoose.Schema.Types.ObjectId,
			time: Date,
		},
	],
});

// Connecting schemes with collections
const Student = mongoose.model("students", studentsSchema);
const Stat = mongoose.model("stats", statsSchema);

// Starting the server
app.listen(port, () => {
	console.log(`The server is running on: http://localhost:${port}/`);
});

// Routes
app.get("/", async (req, res) => {
	let today = new Date();
	today.setHours(8, 30, 0, 0);
	today = today.toISOString();

	let statData = await Stat.aggregate([
		{
			$addFields: {
				todayDate: {
					$toDate: today,
				},
			},
		},
		{
			$match: {
				$expr: { $eq: ["$date", "$todayDate"] },
			},
		},
		{
			$project: {
				_id: 0,
				visitors: {
					$reduce: {
						input: "$visitors",
						initialValue: [0, 0],
						in: {
							$cond: [
								{
									$lt: ["$$this.time", "$date"],
								},
								[
									{
										$add: [
											{
												$arrayElemAt: ["$$value", 0],
											},
											1,
										],
									},
									{
										$arrayElemAt: ["$$value", 1],
									},
								],
								[
									{
										$arrayElemAt: ["$$value", 0],
									},
									{
										$add: [
											{
												$arrayElemAt: ["$$value", 1],
											},
											1,
										],
									},
								],
							],
						},
					},
				},
				glitches: {
					$map: {
						input: ["device", "server", "program"],
						as: "type",
						in: {
							$size: {
								$filter: {
									input: "$systemErrors",
									cond: {
										$eq: ["$$this.errType", "$$type"],
									},
								},
							},
						},
					},
				},
			},
		},
	]);

	res.render("stat", {
		haveData: statData.length != 0,
		visitors: statData.length != 0 ? statData[0].visitors : "No data",
		glitches: statData.length != 0 ? statData[0].glitches : "No data",
	});
});

app.post("/check-uid", async (req, res) => {
	const uid = req.body.uid;

	try {
		const student = await Student.findOne({ uid: uid });

		if (student) {
			if (student.isStudying) {
				res.send("true");

				detectStudent(student._id);
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

app.get("/glitch-detected", (req) => {
	detectGlitch(req.body.type);
});

// Functions
async function detectGlitch(type) {
	let today = new Date();
	today.setHours(8, 30, 0, 0);
	today = today.toISOString();

	const todayStat = await Stat.findOne({ date: today });

	if (todayStat) {
		todayStat.systemErrors.push({ errType: type });

		try {
			await todayStat.save();
		} catch (error) {
			console.error(error);
		}
	} else {
		const newStat = new Stat({
			date: today,
			systemErrors: [{ errType: type }],
			visitors: [],
		});

		try {
			await newStat.save();
		} catch (error) {
			console.error(error);
		}
	}
}

async function detectStudent(student) {
	let today = new Date();
	today.setHours(8, 30, 0, 0);
	today = today.toISOString();

	const todayStat = await Stat.findOne({ date: today });
	const timeNow = new Date();

	if (todayStat) {
		todayStat.visitors.push({ student: student, time: timeNow.toISOString() });

		try {
			await todayStat.save();
		} catch (error) {
			console.error(error);
		}
	} else {
		const newStat = new Stat({
			date: today,
			systemErrors: [],
			visitors: [{ student: student, time: timeNow.toISOString() }],
		});

		try {
			await newStat.save();
		} catch (error) {
			console.error(error);
		}
	}
}
