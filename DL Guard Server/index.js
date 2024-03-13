// Подключение express и создание сервера
const express = require("express");
const app = express();
const port = 3003;

// Добавляем возможность POST-запросов
app.use(express.urlencoded({ extended: true }));

// Подключение к БД
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/dl-guard");

// Создание схем
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

const glitchesSchema = new mongoose.Schema({
	date: Date,
	serverErrors: Number,
	devicesErrors: Number,
	programErrors: Number,
});

const statsSchema = new mongoose.Schema({});

// Соединяем схему с коллекцией
const Student = mongoose.model("students", studentsSchema);
const Glitches = mongoose.model("glitches", glitchesSchema);

// Запуск сервера
app.listen(port, function () {
	console.log(`Сервер запущен по адресу: http://localhost:${port}/`);
});

// Сервисная часть
app.get("/check-uid", async function (req, res) {
	const uid = req.query.uid;

	try {
		const student = await Student.findOne({ uid: uid });

		if (student) {
			if (student.isStudying) {
				res.send("true");
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

app.get("/error-message", async function (req, res) {
	const type = req.query.type;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const isoDate = today.toISOString();

	let todaysGlitches = await Glitches.findOne({ date: isoDate });

	if (todaysGlitches) {
		if (type == "server") {
			todaysGlitches.serverErrors++;
		} else if (type == "device") {
			todaysGlitches.devicesErrors++;
		} else {
			todaysGlitches.programErrors++;
		}

		try {
			await todaysGlitches.save();
		} catch (error) {
			console.error(error);
		}
	} else {
		const newGlitches = new Glitches(
			type == "device"
				? {
						date: isoDate,
						serverErrors: 0,
						devicesErrors: 1,
						programErrors: 0,
				  }
				: type == "server"
				? {
						date: isoDate,
						serverErrors: 1,
						devicesErrors: 0,
						programErrors: 0,
				  }
				: {
						date: isoDate,
						serverErrors: 0,
						devicesErrors: 0,
						programErrors: 1,
				  }
		);

		try {
			await newGlitches.save();
		} catch (error) {
			console.error(error);
		}
	}
});
